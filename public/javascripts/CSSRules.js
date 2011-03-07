isc.defineClass("CSSRules").addProperties({
  legalStyles: ["color", "backgroundColor", "display"],

  init : function() {
    this.Super("init", arguments);

    // cssRules is a cache of the actual rules in the actual stylesheet
    this.cssRules = {};

    var head = document.documentElement.firstChild;
    var title = "Dynamic-Styles";
    isc.Element.insertAdjacentHTML(head, "afterBegin", "<style type='text/css' title='" + title + "' />", true);

    for (var i = 0; i < document.styleSheets.length; i++) {
      if (document.styleSheets[i].title == title) {
        this.stylesheet = document.styleSheets[i];
        break;
      }
    }

    return this;
  },

  setRule : function(selector, styles) {
    var cssRule = this.cssRules[selector];

    if (!cssRule) {
      this.stylesheet.insertRule(selector + " {}", 0);
      cssRule = this.cssRules[selector] = this.stylesheet.cssRules[0];
    }

    this.legalStyles.map(function(style) {
      if (styles[style]) cssRule.style[style] = styles[style];
    });

    return selector;
  },

  getRule: function(selector) {
    var result = {};
    var rule = this.cssRules[selector];
    if (rule) {
      this.legalStyles.map(function(style) {
        if (rule.style[style]) result[style] = rule.style[style];
      });
    }
    return result;
  },

  clearRules: function() {

  }
});

