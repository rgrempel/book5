<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
  xmlns:tei="http://www.tei-c.org/ns/1.0"
  xmlns="http://www.smartclient.com/"
  version="1.0">
  <xsl:output method="xml" encoding="UTF-8" version="1.0" indent="yes"/>

  <xsl:variable name="totalRows" select="count(//tei:surface)" />
  <xsl:param name="startRow" select="0" />
  <xsl:param name="endRow" select="$totalRows" />
  
  <xsl:template match="/">
    <response>
      <status>0</status>
      <totalRows><xsl:value-of select="$totalRows" /></totalRows>
      <startRow><xsl:value-of select="$startRow" /></startRow>
      <endRow>
        <xsl:choose>
          <xsl:when test="$endRow &lt; $totalRows">
            <xsl:value-of select="$endRow" />
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="$totalRows" />
          </xsl:otherwise>
        </xsl:choose>
      </endRow>
      <data>
        <!-- Note that position() is 1-based but startRow is zero-based -->
        <xsl:apply-templates select="(//tei:surface)[position() &gt; $startRow and position() &lt; $endRow + 1]" />
      </data>
    </response>
  </xsl:template>
  
  <xsl:template match="tei:surface">
    <record n="{@n}"
            id="{@xml:id}" 
            dzi_url="{child::tei:graphic[@n='deepzoom']/@url}"
            thumbnail_url="{child::tei:graphic[@n='thumbnail']/@url}"
            original_url="{child::tei:graphic[@n='original']/@url}"
            isc_row="{count(preceding::tei:surface)}" />
  </xsl:template>
</xsl:stylesheet>
