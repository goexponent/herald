export const ALGORITHM_QUERY_PARAM = "X-Amz-Algorithm";
export const CREDENTIAL_QUERY_PARAM = "X-Amz-Credential";
export const AMZ_DATE_QUERY_PARAM = "X-Amz-Date";
export const SIGNED_HEADERS_QUERY_PARAM = "X-Amz-SignedHeaders";
export const EXPIRES_QUERY_PARAM = "X-Amz-Expires";
export const SIGNATURE_QUERY_PARAM = "X-Amz-Signature";
export const TOKEN_QUERY_PARAM = "X-Amz-Security-Token";
export const REGION_SET_PARAM = "X-Amz-Region-Set";

export const AUTH_HEADER = "Authorization";
export const AMZ_DATE_HEADER = AMZ_DATE_QUERY_PARAM.toLowerCase();
export const DATE_HEADER = "date";
export const GENERATED_HEADERS = [AUTH_HEADER, AMZ_DATE_HEADER, DATE_HEADER];
export const SIGNATURE_HEADER = SIGNATURE_QUERY_PARAM.toLowerCase();
export const SHA256_HEADER = "x-amz-content-sha256";
export const TOKEN_HEADER = TOKEN_QUERY_PARAM.toLowerCase();
export const HOST_HEADER = "Host";
export const AMZ_SDK_REQUEST_ID_HEADER = "amz-sdk-invocation-id";
export const AMZ_SDK_REQUEST_HEADER = "amz-sdk-request";
export const CONTENT_LENGTH_HEADER = "Content-Length";
export const S3_COPY_SOURCE_HEADER = "x-amz-copy-source";

// OpenStack
export const OPENSTACK_AUTH_TOKEN_HEADER = "x-subject-token";
export const SWIFT_COPY_DESTINATION_HEADER = "x-copy-from";
