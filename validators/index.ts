/**
 * Validator utilities and helper functions
 */
import { z } from "zod";
export * from "./schemas";

/**
 * Helper function to validate a single field
 * @param schema - Zod schema to validate against (must be a ZodObject)
 * @param fieldName - Name of the field to validate
 * @param value - Value to validate
 * @returns Error message or null if valid
 */
export function validateField(
  schema: z.ZodObject<any>,
  fieldName: string,
  value: unknown
): string | null {
  try {
    // Access the shape property of the ZodObject
    const shape = (schema as any).shape;
    if (!shape || !shape[fieldName]) {
      return null;
    }

    // Validate the field using the field's schema
    const fieldSchema = shape[fieldName];
    fieldSchema.parse(value);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message || null;
    }
    return null;
  }
}

/**
 * Helper function to get field errors from a Zod error
 * @param error - ZodError instance
 * @returns Object with field names as keys and error messages as values
 */
export function getFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  
  // Safety check: ensure error.issues exists and is an array
  // ZodError uses 'issues' property, not 'errors'
  if (!error || !error.issues || !Array.isArray(error.issues)) {
    return errors;
  }
  
  error.issues.forEach((issue) => {
    if (issue && issue.path && Array.isArray(issue.path)) {
      const path = issue.path.join(".");
      errors[path] = issue.message || "Validation error";
    }
  });
  return errors;
}

/**
 * Helper function to validate form data
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with isValid flag and errors
 */
export function validateForm<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): {
  isValid: boolean;
  errors: Record<string, string>;
  data?: z.infer<T>;
} {
  try {
    const validatedData = schema.parse(data);
    return {
      isValid: true,
      errors: {},
      data: validatedData,
    };
  } catch (error) {
    // Check if it's a ZodError (instanceof check and property check for safety)
    if (error instanceof z.ZodError || (error && typeof error === "object" && "errors" in error && "issues" in error)) {
      return {
        isValid: false,
        errors: getFieldErrors(error as z.ZodError),
      };
    }
    return {
      isValid: false,
      errors: { _general: "Validation failed" },
    };
  }
}

