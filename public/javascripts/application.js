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

isc.defineClass("UploadDocumentForm", isc.FileUploadForm).addProperties({
  action: "/documents",
  method: "post",
  errorOrientation: "top",
  showErrorText: true,
  dataSource: "document",
  wrapItemTitles: false,
  fields: [
    {name: "tag", title: "Tag to identify this document", required: true},
    {name: "tei", type: "upload", title: "File to Upload", required: true},
    {
      name: "submit",
      type: "button",
      align: "center",
      colSpan: 2,
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
  width: "25%",
  height: "100%",

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
    backgroundColor: "#EEEEEE",
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

isc.defineClass("AppLayout", isc.HLayout).addProperties({
  width: "100%",
  height: "100%",

  documentLayoutDefaults: {
    _constructor: isc.DocumentLayout
  },

  documentContentsDefaults: {
    _constructor: isc.DocumentContents,
    width: "35%",
    height: "100%"
  },

  initWidget : function () {
    this.Super("initWidget");
    this.addAutoChild("documentLayout");
    this.addAutoChild("documentContents");
  },

  setDocument : function (doc) {
    this.documentContents.setDocument(doc);
  }
});

isc.Page.setEvent("load", function() {
  book5 = isc.AppLayout.create();
  book5.draw();
}, isc.Page.FIRE_ONCE);
