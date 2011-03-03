isc.setAutoDraw(false);

if (window.isc != null) {
    if (isc.version.startsWith("SC_SNAPSHOT-2011-01-05/")) {
        if (isc.HTMLFlow != null) {
            isc.HTMLFlow.addProperties({modifyContent:function () {}});
        }
    } else {
        isc.Log.logWarn("Patch for SmartClient 8.0 final release (reported version 'SC_SNAPSHOT-2011-01-05/') " +
            "included in this application. " + 
            "You are currently running SmartClient verion '"+ isc.version + 
            "'. This patch is not compatible with this build and will have no effect. " +
            "It should be removed from your application source.");
    }
}

var book5;

isc.RailsDataSource.create({
  ID: "document",
  dataURL: "/documents",
  fields: [
    {name: "id", type: "integer", primaryKey: true, hidden: true},
    {name: "tag", type: "text", title: "Tag"},
    {name: "created_at", type: "date_time", title: "Created At"}
  ]
});

isc.RailsDataSource.create({
  ID: "page",
  dataURL: "pages",
  fields: [
    {name: "dzi_url", type: "text"},
    {name: "thumbnail_url", type: "image"},
    {name: "id", type: "text", primaryKey: true},
    {name: "isc_row", type: "integer"}
  ]
});

isc.defineClass("UploadDocumentForm", isc.FileUploadForm).addProperties({
  action: "/documents",
  method: "post",
  errorOrientation: "top",
  showErrorText: true,
  dataSource: "document",
  titleOrientation: "top",
  numCols: 1,
  wrapItemTitles: true,
  fields: [
    {name: "tag", title: "Tag to identify this document", required: true},
    {name: "tei", type: "upload", title: "File to Upload", required: true},
    {
      name: "submit",
      type: "button",
      align: "center",
      click : function (form, item) {
        form.saveFileData({target: form, methodName: "handleReply"});
      }
    }
  ],
  handleReply : function (dsResponse, data, dsRequest) {
    if (dsResponse.status == 0) {
      book5.setDocument(data);
    }
  }
});

isc.defineClass("DocumentGrid", isc.ListGrid).addProperties({
  dataSource: "document",
  autoFetchData: true,
  showAllRecords: false,
  selectionType: "single",

  recordClick : function (viewer, record, recordNum, field, fieldNum, value, rawValue) {
    book5.setDocument(record);
  }
});

isc.defineClass("DocumentLayout", isc.VLayout).addProperties({
  documentGridDefaults: {
    _constructor: isc.DocumentGrid
  },

  uploadFormDefaults: {
    _constructor: isc.UploadDocumentForm
  },

  initWidget : function () {
    this.Super("initWidget");
    this.addAutoChild("documentGrid");
    this.addAutoChild("uploadForm");
  }
});

isc.defineClass("DocumentContents", isc.VLayout).addProperties({
  documentFlowDefaults: {
    _constructor: isc.HTMLPane,
    width: "100%",
    height: "100%"
  },

  documentDownloadDefaults: {
    _constructor: isc.HTMLPane,
    width: "100%",
    height: 40
  },

  initWidget : function () {
    this.Super("initWidget");
    this.addAutoChild("documentFlow");
    this.addAutoChild("documentDownload");
  },

  setDocument : function (doc) {
    this.documentFlow.setContentsURL("/documents/" + doc.id + ".html");
    this.documentDownload.setContents('<a href="/documents/' + doc.id  + '.tei" target="_window">Download TEI file</a>'); 
  }
});

isc.defineClass("PageGrid", isc.ListGrid).addClassProperties({
  thumbWidth: 84,
  thumbHeight: 120
}).addProperties({
  dataSource: "page",
  autoFetchData: true,
  selectionType: "single",
  showHeader: false,
  cellHeight: isc.PageGrid.thumbHeight,
  fixedRecordHeights: true,
  enforceVClipping: true,
  width: isc.PageGrid.thumbWidth + 20,
  handlingPageChange: false,

  fields: [{
      name: "thumbnail_url",
      cellAlign: "center",
      imageHeight: isc.PageGrid.thumbHeight,
      imageWidth: isc.PageGrid.thumbWidth,
      width: isc.PageGrid.thumbWidth
  }],

  initWidget : function() {
    this.Super("initWidget", arguments);
    this.viewableBox = isc.Canvas.create({
      border: "2px dashed yellow"
    });
  },

  draw : function() {
    this.Super("draw", arguments);
    if (this.pageOnDraw) {
      // TODO: This is probably not the right way to do this ...
      this.delayCall("handleScrollToPage", [this.pageOnDraw], 1000);
      this.pageOnDraw = null;
    }
  },

  setPercentRect : function (percentRect) {
    var thumbWidth = this.getClass().thumbWidth;
    var thumbHeight = this.getClass().thumbHeight;
    var scale = Math.max(thumbWidth, thumbHeight);

    var box = [
      percentRect.x * scale,
      percentRect.y * scale,
      percentRect.width * scale,
      percentRect.height * scale
    ]

    if (box[0] + box[2] > thumbWidth) box[2] = thumbWidth - box[0];
    if (box[1] + box[3] > thumbHeight) box[3] = thumbHeight - box[1];
    if (box[0] < 0) {
      box[2] = box[2] + box[0];
      box[0] = 0;
    }
    if (box[1] < 0) {
      box[3] = box[3] + box[1];
      box[1] = 0;
    }
    
    box[1] = box[1] + this.viewableBox.topOffset;
    
    this.viewableBox.setRect(box);
  },

  selectionChanged : function (record, state) {
    if (state) {
      if (!this.handlingPageChange) this.fireScrollToPage(record);
    }
  },

  fireScrollToPage: function (page) {
    return page;
  },

  handleScrollToPage: function (page) {
    if (this.handlingPageChange) return;
    if (!this.isDrawn()) {
      this.pageOnDraw = page;
      return;
    }

    var visible = this.getVisibleRows();
    if (visible[0] < 0) return;

    // check if page is  visible
    var pageIsVisible = false;
    for (var x = visible[0]; x <= visible[1]; x++) {
      if (this.getRecord(x).id == page.id) {
        pageIsVisible = true;
        break;
      }
    }
    
    if (!pageIsVisible) {
      this.body.scrollToRatio(true, page.isc_row / this.getTotalRows());
    }
    
    this.handlingPageChange = true;
    this.selectSingleRecord(page.isc_row);
    this.handlingPageChange = false;
      
    this.addEmbeddedComponent(this.viewableBox, page, page.isc_row, 0, "within");
    this.viewableBox.topOffset = page.sc_row * (this.getClass().thumbHeight);
  }
});

isc.defineClass("DeepZoomLayout", isc.HLayout).addProperties({
  imageDefaults: {
    _constructor: isc.SeaDragon,
    width: "100%",
    height: "100%"
  },

  sliderDefaults: {
    _constructor: isc.PageGrid,
    height: "100%"
  },

  initWidget : function () {
    this.Super("initWidget");

    this.addAutoChild("image");
    this.addAutoChild("slider");

    this.observe(this.image, "fireVisible", "observer.handleImageScrolled(returnVal)");
    this.observe(this.slider, "fireScrollToPage", "observer.handleScrollToPage(returnVal)");
  },

  handleImageScrolled: function (bounds) {
    this.slider.setPercentRect(bounds);
  },

  handleScrollToPage: function (page) {
    this.slider.handleScrollToPage(page);
    if (page && (this.image.dzi_url != page.dzi_url)) {
      this.image.setDZIURL(page.dzi_url);
    }
  }
});

isc.defineClass("AppLayout", isc.HLayout).addProperties({
  documentLayoutDefaults: {
    _constructor: isc.DocumentLayout,
    showResizeBar: true,
    defaultWidth: "20%",
    height: "100%"
  },

  documentContentsDefaults: {
    _constructor: isc.DocumentContents,
    showResizeBar: true,
    defaultWidth: "35%",
    height: "100%"
  },

  deepZoomDefaults: {
    _constructor: isc.DeepZoomLayout,
    defaultWidth: "45%",
    height: "100%"
  },

  initWidget : function () {
    this.Super("initWidget");
    this.addAutoChild("documentLayout");
    this.addAutoChild("documentContents");
    this.addAutoChild("deepZoom");
  },

  setDocument : function (doc) {
    this.documentContents.setDocument(doc);
  }
});

isc.Page.setEvent("load", function() {
  book5 = isc.AppLayout.create({
    width: "100%",
    height: "100%"
  });
  book5.draw();
}, isc.Page.FIRE_ONCE);
