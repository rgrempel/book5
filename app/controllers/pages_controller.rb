class PagesController < ApplicationController
  respond_to :isc

  def index
    respond_with(@pages = Page.all)
  end
end
