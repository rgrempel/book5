class DocumentsController < ApplicationController
  respond_to :html, :isc, :tei, :teihtml, :teisource

  # This one is special because we're using XJSON and uploads
  def create
    @callback = params[:callback]
    @record = Document.new(params)

    if (@record.save)
      @status = 0
    else
      @status = -4
    end

    render :layout => false
  end

  def show
    @document = Document.find params[:id]
    if @document
      respond_to do |format|
        format.tei do
          send_file @document.tei.path, :type => :xml, :x_sendfile => true
        end
        format.html do
          @contents = File.open(@document.tei.path) {|file| file.read}
        end
        format.teihtml do
          @xmldoc = @document.parse_xml
        end
        format.teisource do
          @xmldoc = @document.parse_xml
        end
      end
    end
  end

  def index
    respond_with(@documents = Document.scoped)
  end
end
