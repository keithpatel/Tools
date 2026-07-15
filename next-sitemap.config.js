/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://multitool.example.com",
  generateRobotsTxt: true,
  outDir: "out",
  exclude: ["/404", "/_not-found"],
};
