module.exports = {
  "config": {
    "validation": {
      "schema": {
        "type": "object",
        "properties": {
          "useBuiltinBuilder": {
            "type": "boolean"
          },
          "defaultLanguage": {
            "type": "string"
          },
          "extensions": {
            "type": "object",
            "patternProperties": {
              ".+": {
                "type": "object",
                "patternProperties": {
                  ".+": {
                    "type": "object",
                    "properties": {
                      "messageIn": {
                        "type": "object",
                        "patternProperties": {
                          ".+": {
                            "type": "string"
                          }
                        },
                        "additionalProperties": false
                      }
                    },
                    "additionalProperties": false
                  }
                },
                "additionalProperties": false
              }
            },
            "additionalProperties": false
          },
        },
        "additionalProperties": false
      }
    }
  }
};
