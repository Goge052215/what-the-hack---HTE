var FocusPet = window.FocusPet || {};

FocusPet.PageExtractor = {
  MAX_TEXT_LENGTH: 500,

  extract() {
    const url = window.location.href;
    const title = document.title || "";
    const domain = window.location.hostname;
    const meta = document.querySelector('meta[name="description"]');
    const description = meta ? meta.content.substring(0, 200) : "";

    const bodyText = (document.body && document.body.innerText) || "";
    const text = bodyText.substring(0, this.MAX_TEXT_LENGTH).trim();

    const category = this.detectCategory(domain, url, title);

    return {
      url: url,
      title: title,
      domain: domain,
      description: description,
      text: text,
      category: category,
      timestamp: Date.now()
    };
  },

  detectCategory(domain, url, title) {
    var patterns = {
      video: /youtube|vimeo|netflix|twitch|dailymotion|bilibili/i,
      social: /facebook|twitter|instagram|reddit|tiktok|linkedin|x\.com|threads/i,
      docs: /docs\.google|notion|confluence|dropbox|overleaf|quip/i,
      education: /coursera|udemy|khan|edx|canvas|blackboard|moodle|chegg|quizlet/i,
      news: /news|bbc|cnn|nytimes|guardian|reuters|apnews/i,
      coding: /github|gitlab|stackoverflow|codepen|leetcode|hackerrank|replit/i,
      search: /google\.com\/search|bing\.com\/search|duckduckgo/i,
      email: /gmail|outlook|mail|proton/i,
      shopping: /amazon|ebay|shopify|etsy|aliexpress/i,
      entertainment: /spotify|soundcloud|steam|epicgames|disneyplus/i
    };

    var combined = domain + " " + url + " " + title;
    for (var cat in patterns) {
      if (patterns[cat].test(combined)) return cat;
    }
    return "other";
  }
};

window.FocusPet = FocusPet;