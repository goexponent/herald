import * as z from "zod";

const HttpMethod = z.enum(["GET", "POST", "PUT", "DELETE"]);
export type HttpMethod = z.infer<typeof HttpMethod>;
export const methodSchema = z.string().transform((val) => {
  const upperVal = val.toUpperCase();
  return HttpMethod.parse(upperVal);
});

export const urlFormatStyle = z.enum(["VirtualHosted", "Path"]);
export type URLFormatStyle = z.infer<typeof urlFormatStyle>;

export const requestMeta = z.object({
  bucket: z.string().nullable().optional(),
  objectKey: z.string().nullable().optional(),
  method: HttpMethod,
  urlFormat: urlFormatStyle,
});
export type RequestMeta = z.infer<typeof requestMeta>;

export const requestBodyType = z.enum([
  "Json",
  "FormData",
  "ByteArray",
  "Text",
]);
export type RequestBodyType = z.infer<typeof requestBodyType>;
