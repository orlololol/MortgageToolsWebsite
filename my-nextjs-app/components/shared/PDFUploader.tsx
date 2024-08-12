"use client";

import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InsufficientSubscriptionModal } from "./InsufficientSubscriptionModal";
import { deleteEntries } from "@/app/api/googleSheets/googleSheetsServices";

const fileSchema = z.object({
  file: z
    .instanceof(File)
    .optional()
    .refine((file) => !file || file.type === "application/pdf", {
      message: "File must be a PDF",
    }),
});

export const formSchema = z.object({
  document_type: z.string().min(1, "Document type is required"),
  files: z.array(fileSchema).min(1, "At least one file is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface PDFUploadFormProps {
  action: "Add" | "Update";
  clerkId: string;
  type: "uploadDocumentA" | "uploadDocumentBC";
  isSubscribed: boolean;
  data?: Partial<FormValues> & { _id?: string };
}

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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      document_type:
        data.document_type || (type === "uploadDocumentBC" ? "" : "1040"),
      files: data.files || [{ file: undefined }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "files",
  });

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
      formData.append(
        "document_type",
        type === "uploadDocumentBC" ? values.document_type : "1040"
      );
      formData.append("spreadsheetId", spreadsheetId || "");
      if (values.files[0]?.file) {
        formData.append("file", values.files[0].file);
      } else {
        throw new Error("No file selected");
      }
      console.log("Processing PDF with data:", formData);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const response = await fetch(backendUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to process PDF: ${await response.text()}`);
      }

      const result = await response.json();
      console.log("Processing result:", result);
      alert("PDF processed successfully.");
    } catch (error) {
      console.error("Error processing PDF:", error);
      alert("An error occurred while processing the PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  const onClearEntriesHandler = async () => {
    if (!spreadsheetId) {
      alert("No spreadsheet ID found.");
      return;
    }
    try {
      await deleteEntries(spreadsheetId, "D11:D14");
      await deleteEntries(spreadsheetId, "E11:E14");
      await deleteEntries(spreadsheetId, "F11:F14");
      await deleteEntries(spreadsheetId, "H11:H14");
      await deleteEntries(spreadsheetId, "I11:I14");
      await deleteEntries(spreadsheetId, "G11:G14");
      await deleteEntries(spreadsheetId, "C4:C5");
      await deleteEntries(spreadsheetId, "C17:C20");
      await deleteEntries(spreadsheetId, "E19:E20");
      await deleteEntries(spreadsheetId, "C24");
      await deleteEntries(spreadsheetId, "F24");
      await deleteEntries(spreadsheetId, "C34:C41");
      await deleteEntries(spreadsheetId, "G39:G41");
      await deleteEntries(spreadsheetId, "E40:E41");
      await deleteEntries(spreadsheetId, "C49:C51");
      await deleteEntries(spreadsheetId, "G49:G51");
      await deleteEntries(spreadsheetId, "C62:C64");
      await deleteEntries(spreadsheetId, "G67:G69");
      await deleteEntries(spreadsheetId, "C82:C84");
      await deleteEntries(spreadsheetId, "E83:E84");
      await deleteEntries(spreadsheetId, "G82:G84");
    } catch (error) {
      console.error("Error clearing entries:", error);
      alert("An error occurred while clearing the entries. Please try again.");
    }
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
              {type === "uploadDocumentBC" && (
                <FormField
                  control={form.control}
                  name="document_type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Choose your file type</FormLabel>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="w2" />
                          </FormControl>
                          <FormLabel className="font-normal">W-2</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="paystub" />
                          </FormControl>
                          <FormLabel className="font-normal">Paystub</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormItem>
                  )}
                />
              )}

              <div className="space-y-5">
                {fields.map((field, index) => (
                  <FormItem key={field.id}>
                    <FormLabel>Upload PDF</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            form.setValue(`files.${index}.file`, file);
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
              <div className="flex flex-col gap-4 mt-4">
                <Button
                  type="submit"
                  className="submit-button capitalize"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Process PDFs"}
                </Button>
              </div>
              <div className="flex flex-col gap-4 mt-4">
                <Button
                  type="button"
                  className="submit-button capitalize"
                  onClick={onClearEntriesHandler}
                  disabled={isProcessing}
                >
                  Clear Entries
                </Button>
              </div>
            </div>
            <div>
              {spreadsheetId && (
                <iframe
                  src={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?usp=sharing`}
                  width="1300px"
                  height="1000px"
                ></iframe>
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
