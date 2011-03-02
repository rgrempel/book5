isc.defineClass("SeaDragon","Canvas").addProperties({
  dzi_url: null,
  viewer: null,
  
  draw : function () {
    this.Super("draw", arguments);
    this.viewer = new Seadragon.Viewer(this.getHandle());
    this.viewer.iscHandler = this;
    this.viewer.addEventListener("animation", this.handleVisible);
    this.viewer.addEventListener("open", this.handleVisible);
    this.viewer.addEventListener("resize", this.handleVisible);
    this.setDZIURL(this.dzi_url);
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
