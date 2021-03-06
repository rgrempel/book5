class Document < ActiveRecord::Base
  self.include_root_in_json = false
  attr_accessible :tag, :tei

  has_attached_file :tei, :styles => {:original => {}},
                          :processors => [:TEI],
                          :whiny_thumbnails => true

  def parse_xml
    Nokogiri::XML.parse(File.read(self.tei.path))
  end
end

module Paperclip
  class TEI < Processor
    def make
      begin
        doc = Nokogiri::XML(open(@file))
      rescue => e
        raise PaperclipError, e.message
      end
      if doc.xpath('/tei:TEI', 'tei' => 'http://www.tei-c.org/ns/1.0').length == 0
        raise PaperclipError, "not a TEI file"
      end
      if doc.errors.length > 0
        raise PaperclipError, doc.errors.join
      end
      @file
    end
  end
end
