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
        <div class="tagOpen">
            <xsl:text disable-output-escaping="yes">&amp;lt;</xsl:text>
            <xsl:value-of select="local-name(.)" />
            <xsl:apply-templates select="@*" mode="source" />
            <xsl:text disable-output-escaping="yes">&amp;gt;</xsl:text>
            <xsl:text disable-output-escaping="yes">
                &amp;lt;!-- Omitting the facsimile ... download the
                TEI document to see it --&amp;gt;
            </xsl:text>
        </div>
        <div class="tagClose">
            <xsl:text disable-output-escaping="yes">&amp;lt;/</xsl:text>
            <xsl:value-of select="local-name(.)" />
            <xsl:text disable-output-escaping="yes">&amp;gt;</xsl:text>
        </div>
    </xsl:template>  
    
    <!-- By default, we just copy and descend -->
    <xsl:template name="copy-and-descend" match="*">
        <!-- Construct a div with a class of our tag name -->
        <div class="{local-name(.)}">
            <!-- Deal with our attributes -->
            <xsl:apply-templates select="@*" />
            <!-- Add a div to represent the tag itself ... query whether this
                 should go inside or outside our real markup ... probably inside -->
            <xsl:choose>
                <!-- If we have no children, then output a self-closing tag -->
                <xsl:when test="count(* | text()) = 0">
                    <div class="tagOpenClose">
                        <xsl:text disable-output-escaping="yes">&amp;lt;</xsl:text>
                        <xsl:value-of select="local-name(.)" />
                        <xsl:apply-templates select="@*" mode="source" />
                        <xsl:text disable-output-escaping="yes"> /&amp;gt;</xsl:text>
                    </div> 
                </xsl:when>
                <!-- Otherwise, open, deal with children, and close -->
                <xsl:otherwise>
                    <div class="tagOpen">
                        <xsl:text disable-output-escaping="yes">&amp;lt;</xsl:text>
                        <xsl:value-of select="local-name(.)" />
                        <xsl:apply-templates select="@*" mode="source" />
                        <xsl:text disable-output-escaping="yes">&amp;gt;</xsl:text>
                    </div>
                    <!-- Deal with our children -->
                    <xsl:apply-templates />
                    <!-- Add a div to represent our closing tag -->
                    <div class="tagClose">
                        <xsl:text disable-output-escaping="yes">&amp;lt;/</xsl:text>
                        <xsl:value-of select="local-name(.)" />
                        <xsl:text disable-output-escaping="yes">&amp;gt;</xsl:text>
                    </div>
                </xsl:otherwise>
            </xsl:choose>
        </div>
    </xsl:template>
    
    <!-- For attributes and text, we just copy -->
    <xsl:template match="text() | @*">
        <xsl:copy />
    </xsl:template>

    <!-- Except for xml:id, which we do as id -->
    <xsl:template match="@xml:id">
        <xsl:attribute name="id">
            <xsl:value-of select="." />
        </xsl:attribute>
    </xsl:template>

    <!-- And rend, which we duplicate as style -->
    <xsl:template match="@rend">
        <xsl:copy />
        <xsl:attribute name="style">
            <xsl:value-of select="." />
        </xsl:attribute>
    </xsl:template>

    <!-- And for source, we do something different -->
    <xsl:template match="@*" mode="source">
        <div class="tagAttribute">
            <xsl:text> </xsl:text>
            <xsl:value-of select="local-name(.)" />
            <xsl:text>="</xsl:text>
            <xsl:value-of select="." />
            <xsl:text>"</xsl:text>
        </div>
    </xsl:template>
</xsl:stylesheet>
