class XSLTemplateHandler
  def self.call template
    source = %Q{
      xslt = Nokogiri::XSLT(<<-XSLTemplateHandlerSourceEnd)
        #{template.source}
      XSLTemplateHandlerSourceEnd
      @xsltparams ||= []
      xslt.apply_to @xmldoc, Nokogiri::XSLT.quote_params(@xsltparams)
    }
    return source
  end
end
  
ActionView::Template.register_template_handler :xslt, XSLTemplateHandler
