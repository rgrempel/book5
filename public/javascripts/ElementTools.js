isc.Canvas.addProperties({
  // A convenience method to selectNodes relative to a Canvas
  selectNodes: function(xpath, namespaces) {
    return isc.XMLTools.selectNodes(this.getHandle(), xpath, namespaces) || [];
  },

  scrollToID: function(id, callback) {
    var element = this.selectNodes("descendant::*[@id='" + id + "']").get(0);
    if (element) this.scrollToElement(element, callback);
  },

  scrollToElement: function(element, callback) {
    if (element.nodeType != 1 || !element.offsetWidth) {
      // It's probably hidden ... try scrolling the previousSiblling, or the parent
      if (element.previousSibling) {
        this.scrollToElement(element.previousSibling);
      } else if (element.parentNode) {
        this.scrollToElement(element.parentNode);
      }
      return;
    }

    var scrollTo = isc.Element.getOffsetTop(element);

    this.animateScroll(0, scrollTo, function(){
      isc.Element.yellowFade(element);
      if (callback) this.fireCallback(callback);
    });
  },
});

// A convenience method to find the first ancestor of a nativeTarget that
// matches the supplied xpath.
isc.EventHandler.addClassProperties({
  findTarget: function(xpath, namespaces, ev) {
    if (!ev) ev = isc.EventHandler.lastEvent;
    if (!ev) return null;
    if (!ev.nativeTarget) return null;

    var nodes = isc.XMLTools.selectNodes(ev.nativeTarget, xpath, namespaces);
    if (nodes.getLength() > 0) {
      return nodes.get(0);
    } else {
      return null;
    }
  }
});

// Performs a yellow background highlight which then fades.
// Element is the element to fade ... required
// Color is the highlight color ... defaults to yellow
// Callback is called back at end ... optional
// Duration and acceleration are passed to the animation code ... optional

isc.Element.addClassProperties({
  yellowFade: function(element, color, callback, duration, acceleration) {
    if (!color) color = "#CCCC00";
    if (!duration) duration = 2000;

    // This is the backgroundColor style to restore when we're all done
    var restoreColor = element.style.backgroundColor;

    // This is supposed to be the actual visible color, but it's not working
    var visibleColor = isc.Element.getComputedStyleAttribute(element, "backgroundColor");
    if (visibleColor == "") visibleColor = "#FFFFFF";

    var originalRGB = isc.ColorUtils.htmlToRgb(visibleColor);
    var highlightRGB = isc.ColorUtils.htmlToRgb(color);
    var delta = {
      r: originalRGB.r - highlightRGB.r,
      g: originalRGB.g - highlightRGB.g,
      b: originalRGB.b - highlightRGB.b
    };

    element.style.backgroundColor = color;

    isc.Animation.registerAnimation(function(ratio, ID, earlyFinish) {
      if (earlyFinish || ratio == 1) {
        element.style.backgroundColor = restoreColor;
        if (callback) isc.Element.fireCallback(callback);
      } else {
        var transition = {
          r: Math.floor(highlightRGB.r + delta.r * ratio),
          g: Math.floor(highlightRGB.g + delta.g * ratio),
          b: Math.floor(highlightRGB.b + delta.b * ratio)
        };
        element.style.backgroundColor = isc.ColorUtils.rgbToHtml(transition.r, transition.g, transition.b);
      }
    }, duration, acceleration);
  }
});
