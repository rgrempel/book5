// This is a DyanmicForm customized to cope with file uploads.

isc.defineClass("FileUploadForm", "DynamicForm").addProperties({
  encoding: "multipart",

  saveFileData : function(callback, requestProperties) {
    if (!this.validate()) return false;
    isc.UploadProgressWindow.create({
      form: this,
      callback: callback,
      requestProperties: requestProperties
    }).show();
  },

  setTarget : function(target) {
    this.target = target;
    var form = this.getForm();
    if (form) form.target = target;
  }
});

isc.defineClass("UploadProgressWindow", "Window").addProperties({
  title: "Upload Progress",
  autoCenter: true,
  width: 300,
  height: 150,
  showCloseButton: false,
  showFooter: false,
  xProgressID: null,
  form: null,
  callback: null,
  data: {
    state: "starting"
  },

  initWidget : function() {
    this.Super("initWidget", arguments);

    if (!this.form.originalAction) this.form.originalAction = this.form.action;
    if (!this.requestProperties) this.requestProperties = {};

    this.xProgressID = String (new Date().getTime() * Math.random());
    var connector = (this.form.originalAction.indexOf('?') >= 0) ? "&" : "?";
    this.form.setAction(this.form.originalAction + connector + "X-Progress-ID=" + this.xProgressID +
        "&callback=top['" + this.getID() + "']._saveFileDataCallback");

    this.target = this.getID() + "_callbackIframe";
    this.form.setTarget(this.target);
    this.addItem(isc.Canvas.create({
      height: 10,
      width: 10,
      contents: "<iframe style='position: absolute; visibility: hidden; top: -1000px;' name='" + this.target + "'></iframe>"
    }));
  },

  show : function() {
    this.Super("show", arguments);
    if (!this.shown) {
      this.shown = true;

      // Now, we're going to call into the saveData() code path on the DynamicForm.
      // But, we want to use a custom way of contacting the server ... via a form submission to our hidden iframe,
      // with the JSONP callback. So, we specify a "clientCustom" protocal on the request ... this allows SC to
      // set everything up the way it expects, and then lets us do the actual communication
      // The way we implement our protocol is through transformRequest on the DataSource. Since JavaScript is
      // non-threaded, and we won't be async until after transformRequest, we can do some magic here ...
      var ds = isc.DataSource.get(this.form.dataSource);
      var progressTracker = this;

      var bindings = {
        add: ds.getOperationBinding("add"),
        update: ds.getOperationBinding("update")
      };

      var oldProtocols = {
        add: bindings.add.dataProtocol,
        update: bindings.update.dataProtocol
      };

      bindings.add.dataProtocol = "clientCustom";
      bindings.update.dataProtocol = "clientCustom";

      var oldDataFormat = ds.dataFormat;

      // We save the current transformRequest method on the dataSource, and substitute (temporarily) a version that
      // does what we want ...
      var oldTransformRequest = ds.transformRequest;
      ds.transformRequest = function(dsRequest) {
        // We inject the requestId into the parent context so that we'll have it for the callback ... isn't Javascript fun?
        progressTracker.requestId = dsRequest.requestId;
        // Then, we just get the form to submit itself in the usual way ...
        progressTracker.form.submitForm();
      }

      // Now, this is what actually triggers the code we just wrote ...
      this.form.saveData(this.callback, this.requestProperties);

      // And now we undo the magic
      ds.transformRequest = oldTransformRequest;
      bindings.add.dataProtocol = oldProtocols.add;
      bindings.update.dataProtocol = oldProtocols.update;

      this.delayCall("initProgress");
    }
  },

  _saveFileDataCallback : function (response) {
    if (this.timedUpdate) {
      isc.Timer.clear(this.timedUpdate);
      this.timedUpdate = null;
    }

    // Now we tell the dataSource to get snappy
    var ds = isc.DataSource.get(this.form.dataSource);
    var oldTransformResponse = ds.transformResponse;
    // the response is fine ... just return it
    ds.transformResponse = function(dsResponse, dsRequest, data) {
      return dsResponse;
    };

    ds.processResponse(this.requestId, response.response);

    ds.transformResponse = oldTransformResponse;

    this.markForDestroy();
  },

  initProgress: function(){
    this.progressRS = isc.ResultSet.create({
      dataSource: "uploadprogress",
      criteria: {
        "X-Progress-ID": this.xProgressID
      },
      progressWindow: this,
      dataArrived: function(startRow, endRow) {
        this.progressWindow.handleDataArrived(startRow, endRow);
      }
    });

    this.progressbar = isc.Progressbar.create({
      top: 10,
      height: 20
    });
    this.addItem(this.progressbar);

    this.updateProgress();
  },

  updateProgress: function() {
    this.timedUpdate = null;
    if (this.data.state == "starting" || this.data.state == "uploading") {
      this.progressRS.invalidateCache();
      this.progressRS.get(0);
    }
  },

  handleDataArrived: function(startRow, endRow) {
    if (startRow == 0 && endRow >= 0) {
      this.data = this.progressRS.get(0);
      if (this.data.state == "uploading") {
        this.progressbar.setPercentDone(this.data.received * 100 / this.data.size);
      } else if (this.data.state == "starting") {
        this.progressbar.setPercentDone(0);
      } else {
        return;
      }
      this.timedUpdate = this.delayCall("updateProgress", [], 2000);
    }
  }
});

isc.XJSONDataSource.create({
  ID: "uploadprogress",
  dataURL: "/uploadprogress",
  recordXPath: "/",
  callbackParam: "callback",
  showPrompt: false,
  fields: [
    {name: "state", type: "text"},
    {name: "received", type: "integer"},
    {name: "size", type: "integer"},
    {name: "speed", type: "integer"}
  ]
});

