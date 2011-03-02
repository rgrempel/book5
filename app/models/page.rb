class Page
  extend ActiveModel::Naming
  extend ActiveModel::Translation
  include ActiveModel::MassAssignmentSecurity
  include ActiveModel::Serializers::JSON
  include ActiveModel::Serializers::Xml
  include ActiveModel::Callbacks
  include ActiveModel::Validations
  include ActiveModel::Conversion

  # We create the equivalent of our fields, and make them accessible
  # for mass-assignment ...
  attr_accessor :id, :dzi_url, :thumbnail_url, :isc_row 
  attr_accessible :dzi_url, :thumbnail_url
 
  # This emulates ActiveRecord's :create
  def self.create attr={}
    object = new(attr)
    object.save
    object
  end

  # Return all the pages
  def self.all
    iscRow = -1
    Dir[Rails.root.join("public", "s3", "*.jpg")].sort.map do |file|
      base = File.basename(file, '.jpg')
      page = self.new({
        :dzi_url => File.join("/s3", "deepzoom", "#{base}.xml"),
        :thumbnail_url => File.join("/s3", "thumbnail", "#{base}.jpg"),
      })
      page.isc_row = iscRow += 1
      page.id = base
      page
    end
  end

  # Implements mass-assignment
  def attributes= values
    sanitize_for_mass_assignment(values).each do |k, v|
      send("#{k}=", v)
    end
  end

  # Emulates ActiveRecords :new method
  def initialize attr={}
    super
    self.attributes = attr
  end

  # This is here for the to_xml, to_json etc. methods. I'm not sure
  # what the value in the hash is supposed to mean ... perhaps a
  # default value?
  def attributes
    @attributes ||= {
      'id' => nil,
      'dzi_url' => nil,
      'thumbnail_url' => nil,
      'isc_row' => nil
    }
  end

  def persisted?
    false
  end
end
