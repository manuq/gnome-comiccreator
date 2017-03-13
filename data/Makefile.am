# I chose to use recursive automake so I can use nobase_ and avoid
# 5 different directory declarations
SUBDIRS = icons

app_resource_files = $(shell $(GLIB_COMPILE_RESOURCES) --sourcedir=$(srcdir) --generate-dependencies $(srcdir)/org.gnome.ComicCreator.data.gresource.xml)
org.gnome.ComicCreator.data.gresource: org.gnome.ComicCreator.data.gresource.xml $(app_resource_files)
	$(AM_V_GEN) $(GLIB_COMPILE_RESOURCES) --target=$@ --sourcedir=$(srcdir) $<

resourcedir = $(pkgdatadir)
resource_DATA = org.gnome.ComicCreator.data.gresource 

appsdir = $(datadir)/applications
apps_DATA = org.gnome.ComicCreator.desktop

@INTLTOOL_DESKTOP_RULE@

gsettings_SCHEMAS = org.gnome.ComicCreator.gschema.xml

@GSETTINGS_RULES@

appstream_XML = org.gnome.ComicCreator.appdata.xml

@APPSTREAM_XML_RULES@
@INTLTOOL_XML_RULE@

org.gnome.ComicCreator.service: org.gnome.ComicCreator.service.in
	$(AM_V_GEN) sed \
		-e "s|[@]PACKAGE_NAME@|$(PACKAGE_NAME)|g" \
		-e "s|[@]pkgdatadir@|$(pkgdatadir)|g" \
		-e "s|[@]pkglibdir@|$(pkglibdir)|g" \
		$< > $@

servicedir = $(datadir)/dbus-1/services
service_DATA = org.gnome.ComicCreator.service

EXTRA_DIST = \
	org.gnome.ComicCreator.desktop.in \
	org.gnome.ComicCreator.service.in \
	org.gnome.ComicCreator.data.gresource.xml \
	$(gsettings_SCHEMAS) \
	org.gnome.ComicCreator.appdata.xml.in \
	$(app_resource_files) \
	$(NULL)

CLEANFILES = \
	org.gnome.ComicCreator.service \
	org.gnome.ComicCreator.data.gresource \
	org.gnome.ComicCreator.appdata.xml \
	org.gnome.ComicCreator.appdata.valid \
	$(apps_DATA) \
	*.valid \
	gschemas.compiled \
	$(NULL)

# For uninstalled use
all-local:
	$(GLIB_COMPILE_SCHEMAS) $(builddir)

-include $(top_srcdir)/git.mk
