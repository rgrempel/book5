<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
                xmlns:tei="http://www.tei-c.org/ns/1.0"
                xmlns:exsl="http://exslt.org/common"
                xmlns:str="http://exslt.org/strings"                
                xmlns:set="http://exslt.org/sets"
                xmlns="http://www.w3.org/1999/xhtml" 
                extension-element-prefixes="exsl str set"
                version="1.0">
  
    <xsl:output omit-xml-declaration="yes" method="html" encoding="UTF-8" version="1.0" indent="yes" />

    <xsl:template match="tei:facsimile">
        <!-- We just skip it ... -->
    </xsl:template>  
    
    <!-- By default, we just copy and descend -->
    <xsl:template name="copy-and-descend" match="*">
        <div class="{local-name(.)}">
            <xsl:apply-templates select="@*" />
            <xsl:apply-templates />
            <!-- If there are no children, we add some spurious stuff to avoid a browser bug -->
            <xsl:if test="count(* | text()) = 0">
                <xsl:comment>Empty tag</xsl:comment>
            </xsl:if>
        </div>
    </xsl:template>
    
    <!-- For attributes and text, we just copy -->
    <xsl:template match="text() | @*">
        <xsl:copy />
    </xsl:template>

    <!-- Except for xml:id, which we do as id -->
    <xsl:template match="@xml:id">
        <xsl:attribute name="id">
            <xsl:value-of select="."/>
        </xsl:attribute>
    </xsl:template>
</xsl:stylesheet>
