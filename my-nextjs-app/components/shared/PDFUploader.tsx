"use client";

import React, { useEffect, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { InsufficientSubscriptionModal } from "./InsufficientSubscriptionModal";

const fileSchema = z.object({
  file: z
    .instanceof(File)
    .optional()
    .refine((file) => !file || file.type === "application/pdf", {
      message: "File must be a PDF",
    }),
});

const documentBCSchema = z.object({
  paystub: z.array(fileSchema).max(4),
  w2: z.array(fileSchema).max(2),
  eoy_paystub: z.array(fileSchema).max(2),
});

const formSchemaA = z.object({
  document_type: z.literal("1040"),
  files: z.array(fileSchema).min(1, "At least one file is required"),
});

const formSchemaBC = documentBCSchema.refine(
  (data) => {
    const totalFiles =
      data.paystub.filter((f) => f.file).length +
      data.w2.filter((f) => f.file).length +
      data.eoy_paystub.filter((f) => f.file).length;
    return totalFiles > 0;
  },
  {
    message: "At least one file is required",
  }
);

type FormValuesA = z.infer<typeof formSchemaA>;
type FormValuesBC = z.infer<typeof formSchemaBC>;

interface PDFUploadFormProps {
  action: "Add" | "Update";
  clerkId: string;
  type: "uploadDocumentA" | "uploadDocumentBC";
  isSubscribed: boolean;
  data?: Partial<FormValuesA | FormValuesBC> & { _id?: string };
}

type FormValues = FormValuesA | FormValuesBC;

const PDFUploadForm: React.FC<PDFUploadFormProps> = ({
  action,
  clerkId,
  type,
  isSubscribed,
  data = {},
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const router = useRouter();

  const formA = useForm<FormValuesA>({
    resolver: zodResolver(formSchemaA),
    defaultValues: {
      document_type: "1040",
      files: [{ file: undefined }],
    },
  });

  const formBC = useForm<FormValuesBC>({
    resolver: zodResolver(formSchemaBC),
    defaultValues: {
      paystub: Array(4).fill({ file: undefined }),
      w2: Array(2).fill({ file: undefined }),
      eoy_paystub: Array(2).fill({ file: undefined }),
    },
  });

  const form = (
    type === "uploadDocumentA" ? formA : formBC
  ) as UseFormReturn<FormValues>;

  useEffect(() => {
    const fetchSpreadsheetId = async () => {
      try {
        const response = await fetch(
          `/api/getSpreadsheetId?userId=${clerkId}&type=${type}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch spreadsheet ID");
        }
        const data = await response.json();
        setSpreadsheetId(data.spreadsheetId);
      } catch (error) {
        console.error("Error fetching spreadsheet ID:", error);
      }
    };

    fetchSpreadsheetId();
  }, [clerkId, type]);

  const onProcessHandler = () => {
    if (!isSubscribed) {
      setShowSubscriptionModal(true);
      return;
    }
    form.handleSubmit(onSubmit)();
  };

  async function onSubmit(values: FormValues) {
    if (!isSubscribed) {
      setShowSubscriptionModal(true);
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("spreadsheetId", spreadsheetId || "");

      if (type === "uploadDocumentA") {
        const valuesA = values as FormValuesA;
        formData.append("document_type", valuesA.document_type);
        if (valuesA.files[0]?.file) {
          formData.append("file", valuesA.files[0].file);
        } else {
          throw new Error("No file selected");
        }
      } else {
        const valuesBC = values as FormValuesBC;
        let fileIndex = 0;
        for (const [docType, files] of Object.entries(valuesBC)) {
          files.forEach((fileObj) => {
            if (fileObj.file) {
              formData.append(`files`, fileObj.file);
              formData.append(`document_types`, docType);
              fileIndex++;
            }
          });
        }
      }

      console.log("Processing PDF(s) with data:", formData);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const response = await fetch(backendUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to process PDF(s): ${await response.text()}`);
      }

      const result = await response.json();
      console.log("Processing result:", result);
      if (result.results.some((r: any) => r.error)) {
        alert(
          "Some documents failed to process. Please check the console for details."
        );
      } else {
        alert("All PDFs processed successfully.");
      }
    } catch (error) {
      console.error("Error processing PDF(s):", error);
      alert("An error occurred while processing the PDF(s). Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  const renderFileInputs = (
    name: "paystub" | "w2" | "eoy_paystub",
    label: string,
    count: number
  ) => {
    return (
      <div className="space-y-3">
        <FormLabel>{label}</FormLabel>
        {Array.from({ length: count }).map((_, index) => (
          <FormItem key={`${name}-${index}`}>
            <FormControl>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    formBC.setValue(`${name}.${index}.file` as any, file);
                  }
                }}
                className="input-field"
                disabled={!isSubscribed}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        ))}
      </div>
    );
  };

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onProcessHandler();
          }}
          className="space-y-8"
        >
          <div className="flex flex-row space-x-20">
            <div className="my-4">
              {type === "uploadDocumentA" ? (
                <div className="space-y-5">
                  <FormItem>
                    <FormLabel>Upload 1040 PDF</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            formA.setValue("files.0.file", file);
                          }
                        }}
                        className="input-field"
                        disabled={!isSubscribed}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>
              ) : (
                <div className="space-y-8">
                  {renderFileInputs("paystub", "Paystub", 4)}
                  {renderFileInputs("w2", "W-2", 2)}
                  {renderFileInputs("eoy_paystub", "End of Year Paystub", 2)}
                </div>
              )}
              <div className="flex flex-col gap-4 mt-4">
                <Button
                  type="submit"
                  className="submit-button capitalize"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Process PDFs"}
                </Button>
              </div>
            </div>
            <div>
              {spreadsheetId && (
                <iframe
                  src={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?usp=sharing`}
                  width="1300px"
                  height="1000px"
                />
              )}
            </div>
          </div>
        </form>
      </Form>
      <InsufficientSubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </div>
  );
};

export default PDFUploadForm;
