<%@page import="de.xima.fc.jpa.context.EntityContextFactory"%>
<%@page import="org.apache.commons.lang3.StringUtils"%>
<%@page import="org.omnifaces.util.Json"%>
<%@page import="org.json.JSONArray"%>
<%@page import="org.json.JSONObject"%>
<%@page import="java.util.List"%>
<%@page import="java.io.BufferedReader"%>
<%@page import="java.util.Date"%>
<%@page import="de.xima.fc.entities.Status"%>
<%@page import="de.xima.fc.entities.Mandant"%>
<%@page import="de.xima.fc.mdl.enums.EVerarbeitungsTyp"%>
<%@page import="de.xima.fc.entities.Projekt"%>
<%@page import="de.xima.fc.entities.ProjektRessource"%>
<%@page import="de.xima.fc.entities.ProjektRessourceDatei"%>
<%@page import="de.xima.fc.user.UserContext"%>
<%@page import="de.xima.fc.user.UserContextFactory"%>
<%@page import="de.xima.fc.interfaces.IEntityContext"%>
<%@page contentType="application/octet-stream"%>
<%@page import="de.xima.fc.dao.DaoProvider"%>
<%@page import="de.xima.cmn.dao.AbstractDao"%>

<%
  IEntityContext ec = null;
  try {
    ec = EntityContextFactory.newSystemEntityContext();
    response.setContentType("application/json");

    // Get data for file to be uploaded...
    String requestMethod = request.getMethod();
    Integer projektId = (StringUtils.isNotEmpty(request.getParameter("pid"))) ? Integer.parseInt(request.getParameter("pid")) : 152;
    Integer fileSize = (StringUtils.isNotEmpty(request.getParameter("fs"))) ? Integer.parseInt(request.getParameter("fs")) : 1024*1024*10;
    String userCreate = (StringUtils.isNotEmpty(request.getParameter("uc"))) ? request.getParameter("uc") : "admin";
    String userModify = (StringUtils.isNotEmpty(request.getParameter("um"))) ? request.getParameter("um") : "admin";
    String userCreateProject = (StringUtils.isNotEmpty(request.getParameter("ucp"))) ? request.getParameter("ucp") : "admin";
    String fileName = (StringUtils.isNotEmpty(request.getParameter("fn"))) ? request.getParameter("fn") : "upload.bin";
    String fileDescription = (StringUtils.isNotEmpty(request.getParameter("fd"))) ? request.getParameter("fd") : "New file.";
    String fileIdentifier = (StringUtils.isNotEmpty(request.getParameter("fi"))) ? request.getParameter("fi") : "New file";

    if(requestMethod == "POST") {

        char[] data = new char[fileSize];
        request.getReader().read(data,0,(int)fileSize);

        byte[] myBytes = new String(data).getBytes();
        fileSize = myBytes.length;

        // Get data from DAO provider...
        Projekt projekt = DaoProvider.PROJEKT_DAO.read(ec, projektId);
        List<ProjektRessource> projectResources = projekt.getProjektRessourcen();
        Mandant myMandant = projekt.getMandant();

        // Create new resource...
        ProjektRessource myProjectResource = new ProjektRessource();
        Date myDate = new Date();
        ProjektRessourceDatei myProjectResourceFile = new ProjektRessourceDatei();

        // Setup data...
        myProjectResource.setBeschreibung(fileDescription);
        myProjectResource.setName(fileIdentifier);
        myProjectResource.setProjekt(projekt);

        myProjectResourceFile.setSize(fileSize);
        myProjectResourceFile.setProjektRessource(myProjectResource);
        myProjectResourceFile.setNewData(myBytes);

        myProjectResource.setDatei(myProjectResourceFile);
        myProjectResource.setMandant(myMandant);

        projectResources.add(myProjectResource);

        projekt.setProjektRessourcen(projectResources);

        myProjectResourceFile.setBenutzer_erstellt(userCreate);
        myProjectResourceFile.setBenutzer_geaendert(userModify);
        myProjectResourceFile.setDateiname(fileName);
        myProjectResourceFile.setErstellungsdatum(myDate);
        myProjectResourceFile.setAenderungsdatum(myDate);

        projekt.setErstelltVon(userCreateProject);

        // Upload data
        try {
            DaoProvider.PROJEKT_DAO.update(ec,projekt);
        }
        catch (Exception e) {
            out.print("{\"status\":\"error\",\"reason\":\"INTERNAL_ERROR\"}");
        }

        out.print("{\"status\":\"success\"}");

    }
  }

  finally {
    if (ec != null) ec.close();
  }
%>
