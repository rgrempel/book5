class CreateDocuments < ActiveRecord::Migration
  def self.up
    create_table :documents do |t|
      t.text   :tei_file_name
      t.string :tag
      t.timestamps
    end

    add_index :documents, :tag
  end

  def self.down
    drop_table :documents
  end
end
