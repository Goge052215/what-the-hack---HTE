const { clamp } = require("../../shared/utils/time");

const STOPWORDS = new Set([
  "the",
  "and",
  "or",
  "to",
  "for",
  "with",
  "from",
  "of",
  "in",
  "on",
  "at",
  "by",
  "a",
  "an",
  "is",
  "are",
  "be",
  "as",
  "that",
  "this",
  "it",
  "you",
  "your",
  "we",
  "our",
  "us",
  "www",
  "com",
  "org",
  "net",
  "edu",
  "https",
  "http",
]);

const EDU_KEYWORDS = [
  "tutorial",
  "lecture",
  "course",
  "curriculum",
  "documentation",
  "docs",
  "paper",
  "research",
  "lecture",
  "notes",
  "guide",
  "how to",
  "learn",
  "training",
  "khan",
  "coursera",
  "edx",
  "udemy",
  "arxiv",
  "wikipedia",
  "stackoverflow",
  "github",
  "notion",
  "linear regression",
  "machine learning",
  "data science",
  "statistics",
  "probability",
  "analysis",
  "algorithm",
  "model",
  "regression",
  "classification",
  "derivation",
  "proof",
  "theorem",
  "lecture notes",
  "homework",
  "assignment",
  "syllabus",
  "notebook",
  "dataset",
  "pytorch",
  "tensorflow",
  "scikit",
  "pandas",
  "numpy",
  "matplotlib",
  "sql",
  "postgres",
  "leetcode",
  "coding",
  "workshop",
  "seminar",
  "geeksforgeeks",
  "教程",
  "课程",
  "讲解",
  "文档",
  "笔记",
  "论文",
  "学习",
  "训练",
  "课堂",
  "机器学习",
  "数据科学",
  "统计",
  "概率",
  "算法",
  "模型",
  "回归",
  "分类",
  "证明",
  "作业",
  "课件",
  "课程表",
  "代码",
  "数据集",
  "教程视频",
  "刷题",
  "知乎"
];

const ENTERTAINMENT_KEYWORDS = [
  "shorts",
  "tiktok",
  "douyin",
  "bilibili",
  "netflix",
  "gaming",
  "game",
  "meme",
  "celebrity",
  "music",
  "livestream",
  "live",
  "vlog",
  "reaction",
  "trailer",
  "funny",
  "manga",
  "comic",
  "anime",
  "gameplay",
  "playlist",
  "song",
  "lyrics",
  "prank",
  "challenge",
  "podcast",
  "celebs",
  "娱乐",
  "短视频",
  "综艺",
  "游戏",
  "直播",
  "八卦",
  "刷",
  "追剧",
  "动漫",
  "漫画",
  "番剧",
  "听歌",
  "MV",
  "鬼畜",
  "剪辑",
  "挑战",
  "播客",
];

const PRODUCTIVITY_KEYWORDS = [
  "calendar",
  "notion",
  "todo",
  "task",
  "project",
  "issue",
  "ticket",
  "docs",
  "wiki",
  "spec",
  "design",
  "proposal",
  "meeting",
  "roadmap",
  "dashboard",
  "analytics",
  "jira",
  "confluence",
  "figma",
  "monday",
  "trello",
  "slack",
  "asana",
  "planner",
  "calendar",
  "笔记",
  "清单",
  "任务",
  "项目",
  "需求",
  "设计",
  "会议",
  "看板",
  "日程",
];

const SOCIAL_KEYWORDS = [
  "twitter",
  "x.com",
  "facebook",
  "instagram",
  "reddit",
  "discord",
  "wechat",
  "weibo",
  "xiaohongshu",
  "xiaohongshu.com",
  "forum",
  "comment",
  "thread",
  "subreddit",
  "社交",
  "朋友圈",
  "微博",
  "贴吧",
  "论坛",
  "评论",
  "小红书",
];

const normalizeText = (text) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\w\u4e00-\u9fa5\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const extractTokens = (text) => {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  const tokens = normalized
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
  return Array.from(new Set(tokens));
};

const splitKeywords = (keywords, excludeSet) => {
  const singles = [];
  const phrases = [];
  keywords.forEach((keyword) => {
    if (excludeSet?.has(keyword)) return;
    if (keyword.includes(" ")) phrases.push(keyword);
    else singles.push(keyword);
  });
  return { singles, phrases };
};

const matchKeywords = (contextText, contextTokens, keywordSet) => {
  const hits = [];
  keywordSet.singles.forEach((keyword) => {
    if (contextTokens.has(keyword)) hits.push(keyword);
  });
  keywordSet.phrases.forEach((keyword) => {
    if (contextText.includes(keyword)) hits.push(keyword);
  });
  return hits;
};

const countWeightedHits = (hits, weight = 1) => hits.length * weight;

const containsAny = (contextText, contextTokens, keywords) =>
  keywords.some((keyword) =>
    keyword.includes(" ") ? contextText.includes(keyword) : contextTokens.has(keyword)
  );

const scoreRelevance = ({ goal, context }) => {
  const goalText = normalizeText(goal);
  const contextText = normalizeText(context);
  const goalTokens = extractTokens(goalText);
  const contextTokens = new Set(extractTokens(contextText));
  const matchedKeywords = goalTokens.filter((token) => contextTokens.has(token));

  let semanticScore = 0;
  if (goalTokens.length > 0) {
    semanticScore = matchedKeywords.length / goalTokens.length;
  } else if (goalText && contextText.includes(goalText)) {
    semanticScore = 1;
  }

  const eduSet = splitKeywords(EDU_KEYWORDS);
  const productivitySet = splitKeywords(PRODUCTIVITY_KEYWORDS, new Set(EDU_KEYWORDS));
  const entertainmentSet = splitKeywords(ENTERTAINMENT_KEYWORDS);
  const socialSet = splitKeywords(SOCIAL_KEYWORDS);

  const eduHits = matchKeywords(contextText, contextTokens, eduSet);
  const entertainmentHits = matchKeywords(contextText, contextTokens, entertainmentSet);
  const productivityHits = matchKeywords(contextText, contextTokens, productivitySet);
  const socialHits = matchKeywords(contextText, contextTokens, socialSet);

  const eduWeight = countWeightedHits(eduHits, 1.1);
  const entertainmentWeight = countWeightedHits(entertainmentHits, 1.1);
  const productivityWeight = countWeightedHits(productivityHits, 0.6);
  const socialWeight = countWeightedHits(socialHits, 0.8);

  let relevanceScore = semanticScore;
  relevanceScore += Math.min(0.25, eduWeight * 0.03);
  relevanceScore += Math.min(0.12, productivityWeight * 0.02);
  relevanceScore -= Math.min(0.4, entertainmentWeight * 0.04);
  relevanceScore -= Math.min(0.25, socialWeight * 0.03);

  if (contextTokens.has("youtube")) {
    if (eduHits.length > 0 && matchedKeywords.length > 0) relevanceScore += 0.1;
    if (entertainmentHits.length > 0 && matchedKeywords.length === 0) relevanceScore -= 0.1;
  }
  if (contextTokens.has("github") || contextTokens.has("stackoverflow")) {
    relevanceScore += 0.08;
  }
  if (containsAny(contextText, contextTokens, ["playlist", "shorts", "trailer", "reaction"])) {
    relevanceScore -= 0.08;
  }

  relevanceScore = clamp(relevanceScore, 0, 1);

  let category = "neutral";
  if (relevanceScore >= 0.6) category = "study";
  else if (entertainmentHits.length > 0 && semanticScore < 0.45) category = "entertainment";
  else if (socialHits.length > 0 && relevanceScore < 0.5) category = "entertainment";

  return {
    goal: goalText || null,
    relevanceScore,
    matchedKeywords,
    category,
    signals: {
      semanticScore: clamp(semanticScore, 0, 1),
      eduHits,
      entertainmentHits,
      productivityHits,
      socialHits,
    },
  };
};

module.exports = { scoreRelevance };
