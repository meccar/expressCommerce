export const messageHelper = (
  message: string,
  placeholders: { [key: string]: string | number | undefined }
) => {
  return message.replace(
    /{(.*?)}/g,
    (_, key) => String(placeholders[key]) ?? `${key}`
  );
};
