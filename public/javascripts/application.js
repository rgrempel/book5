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
  ID: "surface",
  dataURL: "/surfaces",
  recordXPath: "/default:response/default:data/*",
  totalRowsXPath: "/default:response/default:totalRows",
  startRowXPath: "/default:response/default:startRow",
  endRowXPath: "/default:response/default:endRow",
  fields: [
    {name: "dzi_url", type: "text"},
    {name: "thumbnail_url", type: "image"},
    {name: "original_url", type: "text"},
    {name: "id", type: "text", primaryKey: true},
    {name: "n", type: "text"},
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
    height: 20
  },

  initWidget : function () {
    this.Super("initWidget");
    this.addAutoChild("documentFlow");
    this.addAutoChild("documentDownload");
  },

  setDocument : function (doc) {
    this.documentFlow.setContentsURL("/documents/" + doc.id + ".teisource");
    this.documentDownload.setContents('<a href="/documents/' + doc.id  + '.tei" target="_window">Download TEI file</a>'); 
  }
});

isc.defineClass("DocumentStyled", isc.HTMLPane).addProperties({
  setDocument : function (doc) {
    this.setContentsURL("/documents/" + doc.id + ".teihtml");
  }
});

isc.defineClass("SurfaceGrid", isc.ListGrid).addClassProperties({
  thumbWidth: 84,
  thumbHeight: 120
}).addProperties({
  dataSource: "surface",
  autoFetchData: false,
  showAllRecords: true, // for smoother scrolling
  selectionType: "single",
  showHeader: false,
  cellHeight: isc.SurfaceGrid.thumbHeight,
  fixedRecordHeights: true,
  width: isc.SurfaceGrid.thumbWidth + 50,
  handlingSurfaceChange: false,
  surfaceOnDraw: null, // A surface to scroll to once we're drawn

  fields: [{
      name: "thumbnail_url",
      cellAlign: "center",
      imageHeight: isc.SurfaceGrid.thumbHeight,
      imageWidth: isc.SurfaceGrid.thumbWidth,
      width: isc.SurfaceGrid.thumbWidth
  },{
      name: "n",
      cellAlign: "center",
      width: 30
  }],

  initWidget : function() {
    this.Super("initWidget", arguments);
    this.viewableBox = isc.Canvas.create({
      border: "2px dashed yellow"
    });
  },

  draw : function() {
    this.Super("draw", arguments);
    if (this.surfaceOnDraw) {
      // TODO: This is probably not the right way to do this ...
      this.delayCall("handleScrollToSurface", [this.surfaceOnDraw], 1000);
      this.surfaceOnDraw = null;
    }
  },

  setDocument : function (doc) {
    this.fetchData({document_id: doc.id});
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
      if (!this.handlingSurfaceChange) this.fireScrollToSurface(record);
    }
  },

  fireScrollToSurface : function (surface) {
    return surface;
  },

  handleScrollToSurface : function (surface) {
    if (this.handlingSurfaceChange) return;
    if (!this.isDrawn()) {
      this.surfaceOnDraw = surface;
      return;
    }

    var visible = this.getVisibleRows();
    if (visible[0] < 0) return;

    // check if surface is  visible
    var surfaceIsVisible = false;
    for (var x = visible[0]; x <= visible[1]; x++) {
      if (this.getRecord(x).id == surface.id) {
        surfaceIsVisible = true;
        break;
      }
    }
    
    if (!surfaceIsVisible) {
      this.body.scrollToRatio(true, surface.isc_row / this.getTotalRows());
    }
    
    this.handlingSurfaceChange = true;
    this.selectSingleRecord(surface.isc_row);
    this.handlingSurfaceChange = false;
      
    this.addEmbeddedComponent(this.viewableBox, surface, surface.isc_row, 0, "within");
    this.viewableBox.topOffset = surface.isc_row * (this.getClass().thumbHeight);
  }
});

isc.defineClass("DeepZoomLayout", isc.HLayout).addProperties({
  imageDefaults: {
    _constructor: isc.SeaDragon,
    width: "100%",
    height: "100%"
  },

  sliderDefaults: {
    _constructor: isc.SurfaceGrid,
    height: "100%"
  },

  setDocument : function (doc) {
    this.slider.setDocument (doc);
  },

  initWidget : function () {
    this.Super("initWidget");

    this.addAutoChild("image");
    this.addAutoChild("slider");

    this.observe(this.image, "fireVisible", "observer.handleImageScrolled(returnVal)");
    this.observe(this.slider, "fireScrollToSurface", "observer.handleScrollToSurface(returnVal)");
  },

  handleImageScrolled : function (bounds) {
    this.slider.setPercentRect(bounds);
  },

  handleScrollToSurface : function (surface) {
    this.slider.handleScrollToSurface(surface);
    if (surface && (this.image.dzi_url != surface.dzi_url)) {
      this.image.setDZIURL(surface.dzi_url);
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
    height: "100%",
    width: "100%"
  },

  styledTEIDefaults: {
    _constructor: isc.DocumentStyled,
    height: "100%",
    width: "100%"
  },

  documentTabsDefaults: {
    _constructor: isc.TabSet,
    showResizeBar: true,
    defaultWidth: "35%",
    height: "100%",
    tabs: [{
      title: "TEI",
      pane: "autoChild:documentContents"
    },{
      title: "Text",
      pane: "autoChild:styledTEI"
    }]
  },

  deepZoomDefaults: {
    _constructor: isc.DeepZoomLayout,
    defaultWidth: "45%",
    height: "100%"
  },

  initWidget : function () {
    this.Super("initWidget");
    this.addAutoChild("documentLayout");
    this.addAutoChild("documentTabs");
    this.addAutoChild("deepZoom");
  },

  setDocument : function (doc) {
    this.documentContents.setDocument(doc);
    this.styledTEI.setDocument(doc);
    this.deepZoom.setDocument(doc);
  }
});

isc.Page.setEvent("load", function() {
  book5 = isc.AppLayout.create({
    width: "100%",
    height: "100%"
  });
  book5.draw();
}, isc.Page.FIRE_ONCE);
