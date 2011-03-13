Seadragon.Config.imagePath = '/javascripts/seadragon-img/';
Seadragon.Config.maxZoomPixelRatio = 4; 

isc.defineClass("SeaDragonOverlay").addProperties({
  element: null,
  rect: null,
  seaDragon: null,
  tracker: null,

  init : function () {
    var ret = this.Super("init", arguments);

    if (!this.element) {
      this.element = document.createElement("div");
      this.element.style.border = "2px solid white";
      this.element.style.backgroundColor = "#666666";
      this.element.style.opacity = "0.4";

      this.message = document.createElement("div");
      this.message.style.position = "absolute";
      this.message.style.left = "2px";
      this.message.style.top = "2px";
      this.message.style.fontSize = "16px";
      this.message.style.color = "blue";
      
      this.element.appendChild(this.message);
    }
    
    if (!this.rect) {
      this.rect = new Seadragon.Rect(0.15, 0.11, 0.14, 0.07);
    }

    this.updateMessage();

    this.element.setAttribute("seaDragonOverlay", this.getID());

    this.tracker = new Seadragon.MouseTracker(this.element);
    this.tracker.overlay = this;
    
    this.tracker.dragHandler = isc.SeaDragonOverlay.dragHandler;
    this.tracker.pressHandler = isc.SeaDragonOverlay.pressHandler;
    this.tracker.releaseHandler = isc.SeaDragonOverlay.releaseHandler;
    
    this.tracker.setTracking(true);

    return ret;
  },

  updateMessage : function () {
    var ulx = Math.round(this.rect.x * 2800);
    var uly = Math.round(this.rect.y * 2800);
    var lrx = Math.round((this.rect.x + this.rect.width) * 2800);
    var lry = Math.round((this.rect.y + this.rect.height) * 2800);
    this.message.innerHTML = '&lt;zone ulx="' + String(ulx) +
                                      '" uly="' + String(uly) +
                                      '" lrx="' + String(lrx) +
                                      '" lry="' + String(lry) + '"&gt;';
  },

  handleDrag : function (position, delta, shift) {
    var dragDelta = position.minus(this._dragStartPosition);
    var pointDelta = this.seaDragon.deltaPointsFromPixels(dragDelta, true);

    this.rect.x = this.rect.x + pointDelta.x;
    this.rect.y = this.rect.y + pointDelta.y;
    this.seaDragon.updateOverlay(this);
    this.updateMessage();
  },

  handlePress : function (position) {
    this._dragStartRect = new Seadragon.Rect(this.rect.x, this.rect.y, this.rect.width, this.rect.height);
    this._dragStartPosition = position;
  
    this.seaDragon.setTracking(false);
  },

  handleRelease : function (insideElementPress, insideElementRelease) {
    this.seaDragon.setTracking(true);
  }
}).addClassMethods({
  dragHandler : function (tracker, position, delta, shift) {
    tracker.overlay.handleDrag(position, delta, shift);
  },

  pressHandler : function (tracker, position) {
    tracker.overlay.handlePress(position);
  },

  releaseHandler : function (tracker, position, insideElementPress, insideElementRelease) {
    tracker.overlay.handleRelease(position, insideElementPress, insideElementRelease);
  }
});

isc.defineClass("SeaDragon", "Canvas").addProperties({
  dzi_url: null,
  viewer: null,
  overlays: [],

  draw : function () {
    this.Super("draw", arguments);
    this.viewer = new Seadragon.Viewer(this.getHandle());
    this.viewer.iscHandler = this;
    this.viewer.addEventListener("animation", this.handleVisible);
    this.viewer.addEventListener("open", this.handleVisible);
    this.viewer.addEventListener("resize", this.handleVisible);
    this.setDZIURL(this.dzi_url);
  },

  destroy : function () {
    this.clearOverlays();
    return this.Super("destroy", arguments);
  },

  clear : function () {
    this.closeDZI();
    this.viewer = null;
    this.Super("clear", arguments);
  },

  handleVisible : function (viewer) {
    viewer.iscHandler.fireVisible();
  },

  getSeaDragonBounds : function () {
    return this.viewer.viewport.getBounds(true);
  },

  fireVisible : function () {
    return this.getSeaDragonBounds();
  },

  showContextMenu : function () {
    var self = this;
    var menuItems = [];

    menuItems.add({
      title: "Create Overlay",
      action : function () {
        var pixels = new Seadragon.Point(self.getOffsetX(), self.getOffsetY());
        var point = self.viewer.viewport.pointFromPixel(pixels, true);
        var size = self.viewer.viewport.deltaPointsFromPixels(new Seadragon.Point(60, 60));
        self.addOverlay(isc.SeaDragonOverlay.create({
          rect: new Seadragon.Rect(point.x, point.y, size.x, size.y)
        }));
      }
    });

    var menu = isc.Menu.create({
      data: menuItems
    });
    
    menu.showContextMenu();
    
    return false;
  },

  addOverlay : function (overlay) {
    if (this.viewer && this.viewer.drawer) {
      this.viewer.drawer.addOverlay(overlay.element, overlay.rect);
      overlay.seaDragon = this;
    }
    this.overlays.add(overlay);
  },

  updateOverlay : function (overlay) {
    if (this.viewer && this.viewer.drawer) {
      this.viewer.drawer.updateOverlay(overlay.element, overlay.rect);
    }
  },

  removeOverlay : function (overlay) {
    if (this.viewer && this.viewer.drawer) {
      this.viewer.drawer.removeOverlay(overlay.element);
    }
    this.overlays.remove(overlay);
  },

  clearOverlays : function () {
    this.overlays.map(function (overlay) {
      overlay.destroy();
    });

    this.overlays = null;
    
    if (this.viewer && this.viewer.drawer) {
      this.viewer.drawer.clearOverlays();
    }
  },

  deltaPointsFromPixels : function (pixels, current) {
    return this.viewer.viewport.deltaPointsFromPixels(pixels, current);
  },

  setTracking : function (enabled) {
    this.viewer.tracker.setTracking(enabled);
  },

  setDZIURL : function (newURL) {
    this.dzi_url = newURL;

    if (this.dzi_url) {
      this.openDZI();
    } else {
      this.closeDZI();
    }
  },

  openDZI : function () {
    if (this.viewer) this.viewer.openDzi(this.dzi_url);
  },

  closeDZI: function () {
    if (this.viewer) this.viewer.close();
  }
});
