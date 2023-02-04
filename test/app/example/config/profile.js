module.exports = {
  framework: {
    mode: "tictac"
  },
  logger: {
    transports: {
      console: {
        type: "console",
        level: "debug",
        json: false,
        timestamp: true,
        colorize: true
      }
    }
  }
};
