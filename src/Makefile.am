NULL =

appdir = $(pkgdatadir)
nodist_app_SCRIPTS = org.gnome.ComicCreator

app_resource_files = $(shell $(GLIB_COMPILE_RESOURCES) --sourcedir=$(srcdir) --generate-dependencies $(srcdir)/org.gnome.ComicCreator.src.gresource.xml)
org.gnome.ComicCreator.src.gresource: org.gnome.ComicCreator.src.gresource.xml $(app_resource_files)
	$(AM_V_GEN) $(GLIB_COMPILE_RESOURCES) --target=$@ --sourcedir=$(srcdir) $<

resourcedir = $(pkgdatadir)
resource_DATA = org.gnome.ComicCreator.src.gresource

org.gnome.ComicCreator: org.gnome.ComicCreator.in
	$(AM_V_GEN) sed \
		-e "s|[@]GJS@|$(GJS)|g" \
		-e "s|[@]PACKAGE_VERSION@|$(PACKAGE_VERSION)|g" \
		-e "s|[@]prefix@|$(prefix)|g" \
		-e "s|[@]libdir@|$(libdir)|g" \
		-e "s|[@]pkgdatadir@|$(pkgdatadir)|g" \
		$< > $@
	@chmod +x $@

EXTRA_DIST = \
	org.gnome.ComicCreator.in \
	org.gnome.ComicCreator.src.gresource.xml \
	$(app_resource_files) \
	$(service_resource_files) \
	$(NULL)

CLEANFILES = \
	org.gnome.ComicCreator \
	org.gnome.ComicCreator.src.gresource \
	$(NULL)

install-exec-hook:
	$(MKDIR_P) $(DESTDIR)$(bindir)
	ln -sf $(appdir)/org.gnome.ComicCreator $(DESTDIR)$(bindir)/$(PACKAGE_TARNAME)
uninstall-hook:
	-rm -f $(DESTDIR)$(bindir)/$(PACKAGE_TARNAME)

-include $(top_srcdir)/git.mk
