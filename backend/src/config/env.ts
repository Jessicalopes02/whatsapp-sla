export const env = {
  port: Number(process.env.PORT || 3333),
  API_URL:
    process.env.TIMELINES_API_BASE_URL ||
    "https://app.timelines.ai/integrations/api",
  API_TOKEN:
    process.env.TIMELINES_API_TOKEN ||
    "4f97eadd-8ed0-4943-9bb6-1ff3105b9cda",
};