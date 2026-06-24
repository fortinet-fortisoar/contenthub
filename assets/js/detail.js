'use strict';

  var yumRepo = 'https://repo.secops-content.forticloud.com';
  var basePath = 'https://fortisoar.contenthub.fortinet.com/';

  init();

  function init() {
    var allItemsJson = localStorage.getItem('allItemsJson');
    allItemsJson = JSON.parse(allItemsJson);
    var detailInfo;
    var detailType = getUrlParameter('type');
    var detailName = getUrlParameter('entity');
    detailName = decodeURIComponent(detailName);
    var detailVersion = getUrlParameter('version');
    if(!detailVersion){
      detailVersion = allItemsJson.filter((item)=> item.name === detailName && item.type === detailType)[0]['version'];
    }
    var detailBuildNumber = getUrlParameter('buildNumber');
    detailBuildNumber = detailBuildNumber ? detailBuildNumber : 'latest';
    var infoPath = "/content-hub/" + detailName + "-" + detailVersion + "/" + detailBuildNumber;
    var detailPath = yumRepo + infoPath + '/info.json';
    var mdFilepath = yumRepo + infoPath + '/release_notes.md';
    var depsPath = yumRepo + "/content-hub/" + detailName + "-" + detailVersion + "/deps.json";

    httpGetAsync(detailPath, function(response) {
      setTimeout(function () {
        $('.item-detail-content').removeClass('d-none');
        $('.details-loader').addClass('d-none');
        $('#topbar-home-link').removeClass('d-none');
        $('#topbar-home-link').addClass('d-inline-block');
      }, 1200);
      detailInfo = response;
      detailInfo.display = detailInfo.label || detailInfo.title;
      detailInfo.type = detailType;
      var iconElement = document.createElement('i');
      iconElement.className = "d-inline-block fs-5 icon-" + detailInfo.type + "-type";
      var contentTypeElement = document.createElement('h6');
      contentTypeElement.className = "d-inline-block fw-light mx-2 theme-text text-uppercase align-top";
      var contentTypeElementText = document.createTextNode(detailInfo.type === 'solutionpack' ? 'Solution Pack' : detailInfo.type === 'howtos' ? 'How To\'s' : detailInfo.type === 'ai_agent' ? 'AI Agent' : detailInfo.type);
      contentTypeElement.append(contentTypeElementText);
      var contentTypeContainer = document.createElement('div');
      contentTypeContainer.append(iconElement);
      contentTypeContainer.append(contentTypeElement);
      document.getElementById("detail-content-type").append(contentTypeContainer);
      document.getElementById("detail-current-breadcrumb").innerHTML = detailInfo.display;
      document.getElementById("dropdownVersionLink").innerHTML = "Version - " + detailInfo.version;
      var detailAvailableVersions = document.getElementById("detail-available-versions");
      var dropdownVersionLink = document.getElementById("dropdownVersionLink");
      if(detailInfo.availableVersions.length > 0){
        detailAvailableVersions.classList.remove("d-none");
        _.each(detailInfo.availableVersions, function(version) {
          var versionTag = document.createElement('a');
          versionTag.className = "btn btn-link dropdown-item rounded-0";
          versionTag.setAttribute("href", basePath + "/detail.html?entity=" + detailInfo.name + "&version=" + version + "&type=" + detailInfo.type);
          versionTag.setAttribute("target", "_self");
          var versionText = document.createTextNode("Version - " + version);
          versionTag.append(versionText);
          detailAvailableVersions.append(versionTag);
        });
      } else {
        dropdownVersionLink.classList.remove("dropdown-toggle");
        detailAvailableVersions.classList.add("d-none");
      }
      
      document.getElementById("detail-heading").innerHTML = detailInfo.display;
      document.getElementById("detail-publisher").innerHTML = detailInfo.publisher;
      document.getElementById("detail-certified").innerHTML = (detailInfo.certified ? "Yes" : "No");
      if (detailInfo.certified) {
        document.getElementById("detail-certified").classList.add("text-success");
      }

      var imageElement;
      if (detailInfo.iconLarge) {
        imageElement = document.createElement('img');
        imageElement.className = "mp-tile-image";
        imageElement.src = yumRepo + detailInfo.iconLarge;
        imageElement.setAttribute("width", "85");
        imageElement.setAttribute("height", "auto");
        imageElement.setAttribute("loading", "lazy");
      } else {
        imageElement = document.createElement('i');
        imageElement.className = "mp-tile-icon icon-" + detailInfo.type + "-large";
      }
      
      document.getElementById("detail-image").appendChild(imageElement);
      document.getElementById("detail-description").innerHTML = detailInfo.description;

      if(detailInfo.releaseNotes === 'available'){
        var httpLoadReleaseNotes = new XMLHttpRequest();
        httpLoadReleaseNotes.open("GET", mdFilepath, false); // false for synchronous request
        httpLoadReleaseNotes.send(null);
        var releaseNotesResponse = httpLoadReleaseNotes.responseText;

        document.getElementById("detail-release-notes").innerHTML = marked.parse(releaseNotesResponse);
      }

      var actionsTabLink = document.getElementById("actions-tab-link");
      var contentsTabLink = document.getElementById("contents-tab-link");
      var actionsTab = document.getElementById("actions");
      var contentsTab = document.getElementById("contents");

      if(detailInfo.type === "connector") {
        var actionsTabContent = document.getElementById("actions-tab-content");
        document.getElementById("release-notes-block").classList.remove("d-none");
        actionsTabLink.classList.remove("d-none");
        contentsTabLink.classList.add("d-none");
        actionsTab.classList.remove("d-none");
        contentsTab.classList.add("d-none");

        var operationTable = document.createElement('table');
        operationTable.className = "table theme-text";
        var operationHeaderRow = document.createElement('tr');
        operationHeaderRow.className = "border";
        var operationHeading1 = document.createElement('th');
        operationHeading1.className = "p-3";
        var operationHeading1Text = document.createTextNode("Operation");
        operationHeading1.append(operationHeading1Text);
        operationHeaderRow.append(operationHeading1);
        var operationHeading2 = document.createElement('th');
        operationHeading2.className = "p-3 border-start";
        var operationHeading2Text = document.createTextNode("Title");
        operationHeading2.append(operationHeading2Text);
        operationHeaderRow.append(operationHeading2);
        var operationHeading3 = document.createElement('th');
        operationHeading3.className = "p-3 border-start";
        var operationHeading3Text = document.createTextNode("Description");
        operationHeading3.append(operationHeading3Text);
        operationHeaderRow.append(operationHeading3);
        operationTable.append(operationHeaderRow);

        _.each(detailInfo.operations, function(operation){
          if(operation.visible === undefined || operation.visible){
            var operationRow = document.createElement('tr');
            operationRow.className = "border";
            var operationColumn1 = document.createElement('td');
            operationColumn1.className = "p-3";
            var operationColumn1Text = document.createTextNode(operation.operation);
            operationColumn1.append(operationColumn1Text);
            operationRow.append(operationColumn1);
            var operationColumn2 = document.createElement('td');
            operationColumn2.className = "p-3 border-start";
            var operationColumn2Text = document.createTextNode(operation.title);
            operationColumn2.append(operationColumn2Text);
            operationRow.append(operationColumn2);
            var operationColumn3 = document.createElement('td');
            operationColumn3.className = "p-3 border-start";
            var operationColumn3Text = document.createTextNode(operation.description);
            operationColumn3.append(operationColumn3Text);
            operationRow.append(operationColumn3);
            operationTable.append(operationRow);
          }
        });
        actionsTabContent.append(operationTable);
      }


      var docLink = detailInfo.help;

      httpGetAsync(depsPath, function(response) {
        if(response && response.dependentSolutionPacks && response.dependentSolutionPacks.length > 0){
          // Show dependencies container
          document.getElementById("detail-deps-container").classList.remove("d-none");
          document.querySelector(".deps-container").classList.remove("d-none");
          // Keep main content at col-md-8
          document.getElementById("detail-main-content").classList.remove("col-md-12");
          document.getElementById("detail-main-content").classList.add("col-md-8");

          var dependentSolutionPacks = createNewDomElement('div', 'row');
          if(response.dependentSolutionPacks.length > 3){
            $('#show-all-deps').removeClass('d-none');
          }
          _.each(response.dependentSolutionPacks, function(deps){
            _.find(allItemsJson, function (item) {
              if(item.name === deps.name){
                var depsCard = createDepsCard(item);
                dependentSolutionPacks.append(depsCard);
              }
            });
          });
          document.getElementById("detail-deps").append(dependentSolutionPacks);
        } else {
          // Hide dependencies container and expand main content
          document.querySelector(".deps-container").classList.add("d-none");
          document.getElementById("detail-main-content").classList.remove("col-md-8");
          document.getElementById("detail-main-content").classList.add("col-md-12");
        }
      });

      var gitDocLink = docLink;
      if(detailInfo.type === "solutionpack") {
        var contentsTabContent = document.getElementById("contents-tab-content");
        actionsTabLink.classList.add("d-none");
        actionsTab.classList.add("d-none");

        var contentRow = document.createElement('div');
        contentRow.className = "row";
        var contentCol = document.createElement('div');
        contentCol.className = "col-md-12";

        if(docLink && docLink.match(/readme.md/gi)){
          docLink = getGitRawDocLink(docLink);
          var baseDocLink = docLink.replace(/readme.md/gi, "");
          var baseDocGitLink = gitDocLink.replace(/readme.md/gi, "docs/");

          var httpLoadSPContentMD = new XMLHttpRequest();
          httpLoadSPContentMD.open("GET", baseDocLink + 'docs/contents.md', false);
          httpLoadSPContentMD.send(null);
          var solutionPackContentMDResponse = httpLoadSPContentMD.status !== 404 ? httpLoadSPContentMD.responseText : '';
        
          if(solutionPackContentMDResponse){
            solutionPackContentMDResponse = solutionPackContentMDResponse.replaceAll('[Home](../README.md)', '[GitHub](' + gitDocLink + ')');
            solutionPackContentMDResponse = solutionPackContentMDResponse.replaceAll('[Home](https://github.com/fortinet-fortisoar/', '[GitHub](https://github.com/fortinet-fortisoar/');
            solutionPackContentMDResponse = solutionPackContentMDResponse.replaceAll("./", baseDocGitLink);
            contentCol.innerHTML = marked.parse(solutionPackContentMDResponse);
            contentsTabLink.classList.remove("d-none");
            contentsTab.classList.remove("d-none");
          } else {
            if(detailInfo.dependencies && detailInfo.dependencies.length > 0){
              var contentHeading = document.createElement('h5');
              var contentHeadingText = document.createTextNode("Solution Pack Dependencies");
              contentHeading.append(contentHeadingText);
              contentCol.append(contentHeading);
              var contentTabData = createContentTabData(detailInfo);
              contentCol.append(contentTabData);
              contentsTabLink.classList.remove("d-none");
              contentsTab.classList.remove("d-none");
            }
          }
        } else {
          if(detailInfo.dependencies && detailInfo.dependencies.length > 0){
            var contentHeading = document.createElement('h5');
            var contentHeadingText = document.createTextNode("Solution Pack Dependencies");
            contentHeading.append(contentHeadingText);
            contentCol.append(contentHeading);
            var contentTabData = createContentTabData(detailInfo);
            contentCol.append(contentTabData);
            contentsTabLink.classList.remove("d-none");
            contentsTab.classList.remove("d-none");
          }
        }

        contentRow.append(contentCol);
        contentsTabContent.append(contentRow);
      }

      // var docLink = 'https://github.com/fortinet-fortisoar/solution-pack-phishing-email-response/blob/1.0.1-doc-changes/README.md';
      var docLinkBlock = document.getElementById("doc-content-block");
      if(docLink && docLink.match(/readme.md/gi)){
        docLink = getGitRawDocLink(docLink);
        var baseDocLink = gitDocLink.replace(/readme.md/gi, "");
        var httpLoadContent = new XMLHttpRequest();
        httpLoadContent.open("GET", docLink, false); // false for synchronous request
        httpLoadContent.send(null);
        var detailReadMeResponse = httpLoadContent.status !== 404 ? httpLoadContent.responseText : '';
        if(detailReadMeResponse !== ''){
          var baseGitDocLink = docLink.replace(/readme.md/gi, "");
          detailReadMeResponse = detailReadMeResponse.replaceAll("./docs/res", baseGitDocLink + '/docs/res');
          detailReadMeResponse = detailReadMeResponse.replaceAll("./", baseDocLink);

          document.getElementById("detail-docs-content").innerHTML = marked.parse(detailReadMeResponse);
          $('.item-github-content').removeClass('d-none');
          docLinkBlock.classList.add("d-block");
          docLinkBlock.classList.remove("d-none");
        }
      } else if(docLink) {
        if(detailInfo.type === "connector" && docLink.match(/help.cybersponse.com/gi)) {
          docLink = "https://docs.fortinet.com/document/fortisoar/" + detailInfo.version + "/" + detailInfo.name + "/";
        }
        var docLinkTag = document.createElement('a');
        docLinkTag.href = docLink;
        docLinkTag.className = "nav-item detail-doc-link";
        docLinkTag.setAttribute("title", "Online Help");
        docLinkTag.setAttribute("target", "_blank");
        docLinkTag.setAttribute("rel", "noopener noreferrer");
        var docLinkText = document.createTextNode("here");
        docLinkTag.append(docLinkText);
        document.getElementById("detail-doc-link-here").append(docLinkTag);
        document.getElementById("detail-doc-link").classList.remove("d-none");
        docLinkBlock.classList.remove("d-block");
        docLinkBlock.classList.add("d-none");
      }
      
      var githubLinkDiv = document.getElementById("detail-github-link");
      if(detailInfo.scm.type === 'public'){
        var githubLink = document.createElement('a');
        githubLink.href = detailInfo.scm.url;
        githubLink.className = "detail-github-link theme-text text-decoration-none";
        githubLink.setAttribute("title", "Github Repo");
        githubLink.setAttribute("target", "_blank");
        githubLink.setAttribute("rel", "noopener noreferrer");
        var githubLinkIcon = document.createElement("i");
        githubLinkIcon.className = "d-inline-block icon-github";
        var githubLinkTextElement = document.createElement("h6");
        githubLinkTextElement.className = "d-inline-block fw-light m-0 mx-2";
        var githubLinkText = document.createTextNode("GitHub");
        githubLinkTextElement.append(githubLinkText);
        githubLink.append(githubLinkIcon);
        githubLink.append(githubLinkTextElement);
        githubLinkDiv.append(githubLink);
        githubLinkDiv.classList.add("d-block");
        githubLinkDiv.classList.remove("d-none");
      } else {
        githubLinkDiv.classList.remove("d-block");
        githubLinkDiv.classList.add("d-none");
      }
      var tagsContainer = document.getElementById("detail-tags-container");
      var tagsDiv = document.getElementById("detail-tags");
      var allTags = detailInfo.tags.length > 0 ? detailInfo.tags : detailInfo.recordTags;
      if(allTags && allTags.length > 0){
        tagsContainer.classList.remove("d-none");
        _.each(allTags, function(tag){
          var tagCard = createNewDomElement('span', 'details-tag-element');
          var tagText = document.createTextNode(tag);
          tagCard.append(tagText);
          tagsDiv.append(tagCard);
        });
      }
    });
  };

  function createContentTabData(detailInfo){
    var contentDiv = createNewDomElement('ul', 'detail-dependency-container');

    _.each(detailInfo.dependencies, function(dependency){
      var contentList = createNewDomElement('li', 'm-0');
      var contentTitle = createNewDomElement('span', 'm-0');
      var contentTitleText = document.createTextNode(dependency.label);
      contentTitle.append(contentTitleText);
      contentList.append(contentTitle);
      var contentVersion = createNewDomElement('span', 'm-0 muted');
      var contentVersionText = document.createTextNode(" - " + dependency.version);
      contentVersion.append(contentVersionText);
      contentList.append(contentVersion);
      contentDiv.append(contentList);
    });
    return contentDiv;
  }

  function getGitRawDocLink(docLink){
    docLink = docLink.replace("github.com", "raw.githubusercontent.com");
    docLink = docLink.replace("/blob/", "/");
    docLink = docLink.replace("/tree/", "/");
    return docLink;
  }

  function httpGetAsync(theUrl, callback){
    http.onreadystatechange = function() {
      if (http.readyState == 4) {
        if (http.status == 200) {
          try {
            callback(JSON.parse(http.responseText));
          } catch (e) {
            callback(null);
          }
        } else {
          // Handle 404 or other errors gracefully - treat as no data
          callback(null);
        }
      }
    }
    http.open("GET", theUrl, true);
    http.send(null);
  };

  function navigateToContent(){
    window.location.href = "/list.html?contentType=all";
  }

  function createNewDomElement(elementType, elementClasses){
    var element = document.createElement(elementType);
    if(elementClasses){
      element.className = elementClasses;
    }
    return element;
  }

  function showAllDeps() {
    var detailDeps = document.getElementById('detail-deps');
    detailDeps.style.height = "100%";
    $('#show-all-deps').addClass('d-none');
  }

  function createDepsCard(listItem){
    var itemDiv = createNewDomElement('div', 'col-md-12');
    var aTaglistItem = createNewDomElement('a', 'theme-text mp-tile-container mp-tile-' + listItem.type + '-container text-decoration-none');
    var entityName = encodeURIComponent(listItem.name);
    aTaglistItem.href = basePath + "/detail.html?entity=" + entityName + "&version=" + listItem.version + "&type=" + listItem.type;
    aTaglistItem.setAttribute("title", listItem.label);
    
    var itemIconSpan = createNewDomElement('span', 'mp-content-type-icon pull-left');
    var itemIcon = createNewDomElement('i', "icon-" + listItem.type + "-type icon");
    itemIconSpan.appendChild(itemIcon);
    aTaglistItem.appendChild(itemIconSpan);
    
    var itemType = createNewDomElement('p', 'mp-content-type');
    var itemTypeText = document.createTextNode(listItem.type === 'solutionpack' ? 'Solution Pack' : listItem.type === 'howtos' ? 'How To\'s' : listItem.type);
    itemType.appendChild(itemTypeText);
    aTaglistItem.appendChild(itemType);

    var itemContentDiv = createNewDomElement('div');

    var itemTitle = createNewDomElement('h4', 'mp-tile-title');
    var itemTitleText = document.createTextNode(listItem.label || listItem.display);
    itemTitle.appendChild(itemTitleText);
    itemContentDiv.appendChild(itemTitle);

    var itemDetailsDiv = createNewDomElement('div', 'mp-tile-details');

    var itemVersion = createNewDomElement('p', 'm-0 d-inline-block');
    var itemVersionTag = createNewDomElement('span', 'muted');
    var itemVersionTagText = document.createTextNode("Version: ");
    itemVersionTag.appendChild(itemVersionTagText);
    itemVersion.appendChild(itemVersionTag);
    var itemVersionText = document.createTextNode(listItem.version);
    itemVersion.appendChild(itemVersionText);
    itemDetailsDiv.appendChild(itemVersion);

    var verticalSeparator = createNewDomElement('span', 'p-2');
    var verticalSeparatorText = document.createTextNode(" | ");
    verticalSeparator.appendChild(verticalSeparatorText);
    itemDetailsDiv.appendChild(verticalSeparator);

    var itemCertified = createNewDomElement('p', 'm-0 d-inline-block');
    var itemCertifiedTag = createNewDomElement('span', 'muted');
    var itemCertifiedTagText = document.createTextNode("Certified: ");
    itemCertifiedTag.appendChild(itemCertifiedTagText);
    itemCertified.appendChild(itemCertifiedTag);
    var itemCertifiedText = document.createTextNode(listItem.certified ? 'Yes' : 'No');
    itemCertified.appendChild(itemCertifiedText);
    itemDetailsDiv.appendChild(itemCertified);
    
    itemContentDiv.appendChild(itemDetailsDiv);
    aTaglistItem.appendChild(itemContentDiv);
    itemDiv.appendChild(aTaglistItem);

    return itemDiv;
  }
