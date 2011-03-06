class SurfacesController < ApplicationController
  def index
    # SmartClient will send the params as SimpleCriteria or AdvancedCriteria.
    # For the moment, just dealing with SimpleCriteria for XSLT, since
    # AdvancedCriteria would require some work to implement.
    # TODO: Should decode SmartClient criteria JSON in the gem
    id = if params[:criteria]
      ActiveSupport::JSON.decode(params[:criteria])["document_id"]
    else
      params[:document_id]
    end
    doc = Document.find id
    @xmldoc = doc.parse_xml
    @xsltparams = [
      'startRow', @isc_metadata['startRow'],
      'endRow', @isc_metadata['endRow']
    ]
  end
end
