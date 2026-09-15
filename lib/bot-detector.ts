/**
 * Comprehensive Bot, Crawler, and Scraper Detector
 * Protects platform analytics, impressions, and engagement metrics from automated inflation.
 */

// Regex patterns matching known web crawlers, search engine indexers, preview fetchers, and scraping tools
const BOT_USER_AGENTS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /slurp/i,
  /googlebot/i,
  /bingbot/i,
  /bingpreview/i,
  /yandex/i,
  /baiduspider/i,
  /duckduckbot/i,
  /sogou/i,
  /exabot/i,
  /facebot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /tweetmemebot/i,
  /whatsapp/i,
  /telegrambot/i,
  /linkedinbot/i,
  /slackbot/i,
  /discordbot/i,
  /skypeuripreview/i,
  /pinterest/i,
  /redditbot/i,
  /applebot/i,
  /flipboard/i,
  /tumblr/i,
  /bitlybot/i,
  /embedly/i,
  /quora link preview/i,
  /outbrain/i,
  /vkshare/i,
  /w3c_validator/i,
  /google-adsense-bot/i,
  /mediapartners-google/i,
  /bytespider/i,
  /gptbot/i,
  /chatgpt-user/i,
  /claude-web/i,
  /claudebot/i,
  /anthropic-ai/i,
  /cohere-ai/i,
  /ccbot/i,
  /diffbot/i,
  /perplexitybot/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /python-urllib/i,
  /aiohttp/i,
  /httpx/i,
  /go-http-client/i,
  /node-fetch/i,
  /axios/i,
  /postmanruntime/i,
  /insomnia/i,
  /java\//i,
  /scrapy/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
  /headlesschrome/i,
  /phantomjs/i,
  /lighthouse/i,
  /headless/i,
  /sitebulb/i,
  /ahrefsbot/i,
  /semrushbot/i,
  /mj12bot/i,
  /dotbot/i,
  /screaming frog/i,
];

/**
 * Checks if a given User-Agent string belongs to a known bot, crawler, or automated script.
 */
export function isBot(userAgent?: string | null): boolean {
  if (!userAgent || typeof userAgent !== "string") {
    // Missing or empty User-Agent is almost always an automated HTTP script
    return true;
  }

  const ua = userAgent.trim();
  if (ua.length < 10) return true; // Suspiciously short user agent

  return BOT_USER_AGENTS.some((pattern) => pattern.test(ua));
}

/**
 * Client-side browser checks to detect headless execution or automated testing drivers.
 */
export function isClientBot(): boolean {
  if (typeof window === "undefined") return false;

  // 1. Check navigator.webdriver flag (set automatically by Selenium, Puppeteer, Playwright)
  if (navigator.webdriver) {
    return true;
  }

  // 2. Check for automation library artifacts
  const win = window as any;
  if (
    win._phantom ||
    win.__nightmare ||
    win.callPhantom ||
    win.__selenium_unwrapped ||
    win.Cypress ||
    win.__playwright
  ) {
    return true;
  }

  // 3. Check for headless browser indicators
  if (
    navigator.userAgent.indexOf("HeadlessChrome") !== -1 ||
    (navigator.languages && navigator.languages.length === 0) ||
    window.outerWidth === 0 ||
    window.outerHeight === 0
  ) {
    return true;
  }

  return false;
}
