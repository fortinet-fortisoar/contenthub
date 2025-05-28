'use strict';

const http = new XMLHttpRequest();

var yumRepo = 'https://repo.fortisoar.fortinet.com/';
var basePath = 'https://fortisoar.contenthub.fortinet.com/';
var listItems = [];
var listItemsBkp;
var showContentTypeClearFilter = false;
var showCategoryClearFilter = false;
var showPublisherClearFilter = false;
var clearAllFilter = false;
var paramContentType = getUrlParameter('contentType');
var searchContent = getUrlParameter('searchContent');
var paramCategory = getUrlParameter('category');
var paramPublisher = getUrlParameter('publisher');
var paramSortBy = getUrlParameter('sortBy');
var paramFilterBy = getUrlParameter('filterBy');
var categoryList = [];
var publisherList = [];
var contentTypeList = [{ 'name': 'Connectors', 'value': 'connector' }, { 'name': 'Solution Packs', 'value': 'solutionpack' }, { 'name': 'Widgets', 'value': 'widget' }, { 'name': 'Resources', 'value': 'resources' }];
var contentSubTypeList = [{ 'name': 'FortiSOAR Kit', 'value': 'datasheet'}, {'name': 'Demo Videos', 'value': 'demovideos'}, {'name': 'Product How To\'s', 'value': 'howtos'}];
var totalItems = 0;

$(document).ready(function () {
  //Top nav bar
  var topbar = $('#topbar-container');
  if (topbar) {
    topbar.load('assets/html/topbar.html', function() {
      var themeApplied = localStorageGetSetItem('get', 'themeApplied');
      themeApplied = themeApplied ? themeApplied : 'Dark Theme';
      setTimeout(function () {
        toggleTheme(themeApplied);
      }, 10);
      if(window.location.href.indexOf('list.html') > -1 && !paramCategory && !paramPublisher && paramContentType !== 'all'){
        var paramContentTypeArray = paramContentType ? paramContentType.split(',') : [];
        if(paramContentTypeArray.length === 1){
          updateHeaderContentTypeLinks(paramContentTypeArray[0], 'header');
        }
      }
    });
  }
  //Footer
  var footer = $('#footer-container');
  if (footer) {
    footer.load('assets/html/footer.html');
  }
  $('.dropdown-toggle').dropdown();
  $('.nav-tabs').tab();

  if ($(window).width() <= 450) {
    $('.custom-search-alert').addClass('d-none');
    $('.content-count-sort-container .global-search-input-sm').removeClass('w-25');
  }
});

function reloadURLParams(){
  paramContentType = getUrlParameter('contentType');
  searchContent = getUrlParameter('searchContent');
  paramCategory = getUrlParameter('category');
  paramPublisher = getUrlParameter('publisher');
  paramSortBy = getUrlParameter('sortBy');
  paramFilterBy = getUrlParameter('filterBy');
}

function loadSidebar(){
  var navBar = $('#sidebar');
  //Sidebar on listing page
  if (navBar && navBar.length > 0) {
    var xmlHttp = new XMLHttpRequest();
    navBar.load('assets/html/sidebar.html');

    //Check headers last modified date
    var contentHubFilterJsonPath = yumRepo + "content-hub/content-hub-filters.json";
    var allFiltersJson = localStorageGetSetItem('get', 'allFiltersJson');
    httpGetHeaderInfo(contentHubFilterJsonPath, function(lastModifiedDate) {
      console.log(lastModifiedDate);

      if (!localStorage.hasOwnProperty('filterJsonlastModifiedDate')) {
        localStorageGetSetItem('set', 'filterJsonlastModifiedDate', lastModifiedDate);
      }
      var filterJsonlastModifiedDate = localStorageGetSetItem('get', 'filterJsonlastModifiedDate');

      if(filterJsonlastModifiedDate !== lastModifiedDate || !allFiltersJson){
        localStorageGetSetItem('set', 'filterJsonlastModifiedDate', lastModifiedDate);
        xmlHttp.open("GET", contentHubFilterJsonPath, false); // false for synchronous request
        xmlHttp.send(null);
        var allFilterJsonResponse = xmlHttp.responseText;
        localStorageGetSetItem('set', 'allFiltersJson', allFilterJsonResponse);
        allFiltersJson = allFilterJsonResponse;
      }

      allFiltersJson = JSON.parse(allFiltersJson);
      
      categoryList = allFiltersJson.category;
      publisherList = allFiltersJson.publisher;
      setTimeout(function () {
        if (searchContent) {
          $("#searchText").val(searchContent);
        }
        if ($(window).width() <= 450) {
          $('.sidebar').addClass('d-none');
          $('.mobile-view-filter-btn').removeClass('d-none');
        }
        buildFilterList('contentType');
        buildFilterList('category');
        buildFilterList('publisher');
      }, 1000);
      showHomePageLink();
    });
  }
}

function buildFilterList(type, filter, match) {
  reloadURLParams();
  var emptyTextElement = createNewDomElement('p', 'font-size-sm text-light');
  var emptyResultText = document.createTextNode('No Result Found');
  emptyTextElement.append(emptyResultText);
  var emptyContentType = true;
  var emptyCategoryType = true;
  var emptyPublisherType = true;
  if (type === 'category') {
    var categoryListUl = $("#filter-category-list");
    categoryListUl.html('');
    var paramCategoryArray = paramCategory ? paramCategory.split(',') : [];
    _.each(categoryList, function (category) {
      var categoryLi = createSideBarLinks(paramCategoryArray, category, 'category', filter, match);
      if(categoryLi.className === 'sidebar-item list-unstyled fw-light'){
        emptyCategoryType = false;
      }
      categoryListUl.append(categoryLi);
    });
    if(emptyCategoryType){
      categoryListUl.append(emptyTextElement);
    }
  } else if (type === 'publisher') {
    var publisherListUl = $("#filter-publisher-list");
    publisherListUl.html('');
    var paramPublisherArray = paramPublisher ? paramPublisher.split(',') : [];
    _.each(publisherList, function (publisher) {
      var publisherLi = createSideBarLinks(paramPublisherArray, publisher, 'publisher', filter, match);
      if(publisherLi.className === 'sidebar-item list-unstyled fw-light'){
        emptyPublisherType = false;
      }
      publisherListUl.append(publisherLi);
    });
    if(emptyPublisherType){
      publisherListUl.append(emptyTextElement);
    }
  } else if (type === 'contentType') {
    var contentTypeListUl = $("#filter-contenttype-list");
    contentTypeListUl.html('');
    var paramContentTypeArray = paramContentType ? paramContentType.split(',') : [];
    _.each(contentTypeList, function (contentType) {
      var contentTypeLi = createSideBarLinks(paramContentTypeArray, contentType, 'contentType', filter, match);
      if(contentTypeLi.className === 'sidebar-item list-unstyled fw-light'){
        emptyContentType = false;
      }
      contentTypeListUl.append(contentTypeLi);
    });
    if(emptyContentType){
      contentTypeListUl.append(emptyTextElement);
    }
  }
  updateFilterButtons();
}

function createSideBarLinks(filterContentArray, selectedItem, type, filter, match){
  var selectedItemValue = selectedItem.value ? selectedItem.value : selectedItem;
  selectedItemValue = selectedItemValue.replace(',', '');
  var selectedItemName = selectedItem.name ? selectedItem.name : selectedItem;
  var selectedFilter = _.find(filterContentArray, function (filterItem) {
    return filterItem === selectedItemValue;
  });
  var elementLi = document.createElement('li');
  var matchFound = false;
  if(filter){
    matchFound = selectedItemName.toLowerCase().indexOf(match.toLowerCase()) > -1;
    elementLi.className = matchFound ? "sidebar-item list-unstyled fw-light" : "sidebar-item list-unstyled fw-light d-none";
  } else {
    elementLi.className = "sidebar-item list-unstyled fw-light";
  }

  var elementInput = createNewDomElement('input', 'sidebar-link');
  elementInput.setAttribute("type", "checkbox");
  elementInput.setAttribute("value", selectedItemValue);
  if (selectedFilter) {
    elementInput.setAttribute("checked", true);
    toggleClearFilter(type);
  }
  elementInput.addEventListener("click", function () {
    applyFilter(this, selectedItemValue, type, 'filter');
  });
  elementLi.appendChild(elementInput);

  var elementTextWrapper = createNewDomElement('span', 'sidebar-link-text');
  var elementText = document.createTextNode(selectedItemName);
  elementTextWrapper.appendChild(elementText);
  elementLi.appendChild(elementTextWrapper);

  if(type === 'contentType' && selectedItemValue === 'resources'){
    elementInput.setAttribute("id", "resources_content");
    var contentSubTypeListUl = createNewDomElement('ul', 'sidebar-sub-link');
    contentSubTypeListUl.setAttribute("id", "resources_subcontent_list");
    _.each(contentSubTypeList, function (contentSubType) {
      var selectedSubFilter = _.find(filterContentArray, function (filterSubItem) {
        return filterSubItem === contentSubType.value;
      });
      var contentSubTypeLi = document.createElement('li');
      contentSubTypeLi.className = "sidebar-item list-unstyled fw-light";
      var subElementInput = createNewDomElement('input', 'sidebar-link');
      subElementInput.setAttribute("type", "checkbox");
      subElementInput.setAttribute("value", contentSubType.value);
      if(elementInput.checked || selectedSubFilter){
        subElementInput.setAttribute("checked", true);
        toggleClearFilter('contentType');
      }
      subElementInput.addEventListener("click", function () {
        applySubContentFilter(this, contentSubType.value);
      });
      contentSubTypeLi.appendChild(subElementInput);

      var subElementTextWrapper = createNewDomElement('span', 'sidebar-link-text');
      var subElementText = document.createTextNode(contentSubType.name);
      subElementTextWrapper.appendChild(subElementText);
      contentSubTypeLi.appendChild(subElementTextWrapper);
      contentSubTypeListUl.append(contentSubTypeLi);
    });
    elementLi.append(contentSubTypeListUl);
  }

  return elementLi;
}

function toggleClearFilter(type){
  showContentTypeClearFilter = type === 'contentType' ? true : showContentTypeClearFilter;
  showCategoryClearFilter = type === 'category' ? true : showCategoryClearFilter;
  showPublisherClearFilter = type === 'publisher' ? true : showPublisherClearFilter;
}

function updateContentSubTypeSelection(type, value){
  var subContentLinks = $("#resources_subcontent_list input");
  if(type === 'add'){
    _.each(subContentLinks, function(subContentLink){
      subContentLink.checked = true;
      if(value === 'resources'){
        setTimeout(function(){
          updateSubContentTypeParams('remove', subContentLink);
        }, 10);
      }
    });
  } else {
    _.each(subContentLinks, function(subContentLink){
      subContentLink.checked = false;
    });
  }
}

function updateSubContentTypeParams(type, subContentLink, from, e){
  if(from === 'header') {
    e.preventDefault();
    e.stopPropagation();
    if (window.location.href.indexOf('list.html') > -1) {
      resetAllCheckboxes($('.sidebar-item input'));
      updateSubcontentTypeURL(type);
      var subContentLinks = $("#resources_subcontent_list input");
      _.each(subContentLinks, function(subContLink){
        if(subContLink.value === type){
          subContLink.checked = true;
        } else {
          subContLink.checked = false;
        }
      });
    } else {
      window.location.href = basePath + "/list.html?contentType=" + type;
    }
  } else {
    var paramContentTypeAvailable = paramContentType.indexOf(subContentLink.value) > -1;
    if((paramContentTypeAvailable && type === 'remove') || (!paramContentTypeAvailable && type === 'add')){
      var contentTypeParams = updateFilterParams(paramContentType, subContentLink.value, type, 'contentType');
      updateSubcontentTypeURL(contentTypeParams);
    }
  }
}

function updateSubcontentTypeURL(contentTypeParams){
  var appendFilterToURL = appendFilterParamsToURL(contentTypeParams, paramCategory, paramPublisher);
  window.history.replaceState(null, null, appendFilterToURL);
  updateFilterButtons();
  filterContentByParams();
}

function updateFilterButtons() {
  clearAllFilter = false;

  if (showContentTypeClearFilter || showCategoryClearFilter || showPublisherClearFilter) {
    clearAllFilter = true;
  }
  var clearAllBtn = $("#clear-all-filter-btn");
  var clearContentTypeBtn = $("#clear-contenttype-filter-btn");
  var clearCategoryBtn = $("#clear-category-filter-btn");
  var clearPublisherBtn = $("#clear-publisher-filter-btn");
  var navBar = document.getElementById('sidebar');
  if (navBar) {
    !clearAllFilter ? clearAllBtn.addClass("disabled").removeClass("custom-btn-bg border-0") : clearAllBtn.removeClass("disabled").addClass("custom-btn-bg border-0");
    !showContentTypeClearFilter ? clearContentTypeBtn.addClass("disabled").removeClass("custom-btn-bg border-0") : clearContentTypeBtn.removeClass("disabled").addClass("custom-btn-bg border-0");
    !showCategoryClearFilter ? clearCategoryBtn.addClass("disabled").removeClass("custom-btn-bg border-0") : clearCategoryBtn.removeClass("disabled").addClass("custom-btn-bg border-0");
    !showPublisherClearFilter ? clearPublisherBtn.addClass("disabled").removeClass("custom-btn-bg border-0") : clearPublisherBtn.removeClass("disabled").addClass("custom-btn-bg border-0");
  }
  if(paramSortBy){
    document.getElementById('content-sort-by').value = paramSortBy;
  }
  if(paramFilterBy){
    document.getElementById('content-filter-by').value = paramFilterBy;
  }
  if(searchContent){
    document.getElementById('searchText').value = searchContent;
  }
}

function clearFilter(type) {
  reloadURLParams();
  var appendFilterToURL = basePath + "/list.html";
  if (type == 'contentType') {
    appendFilterToURL += "?contentType=all";
    if (paramCategory) {
      appendFilterToURL += "&category=" + paramCategory;
    }
    if (paramPublisher) {
      appendFilterToURL += "&publisher=" + paramPublisher;
    }
    if (searchContent) {
      appendFilterToURL += "&searchContent=" + searchContent;
    }
    if (paramSortBy) {
      appendFilterToURL += "&sortBy=" + paramSortBy;
    }
    if (paramFilterBy) {
      appendFilterToURL += "&filterBy=" + paramFilterBy;
    }
    showContentTypeClearFilter = false;
    resetAllCheckboxes($('#filter-contenttype-list input'));
  } else if (type == 'category') {
    if (paramContentType) {
      appendFilterToURL += "?contentType=" + paramContentType;
    } else {
      appendFilterToURL += "?contentType=all";
    }
    if (paramPublisher) {
      appendFilterToURL += "&publisher=" + paramPublisher;
    }
    if (searchContent) {
      appendFilterToURL += "&searchContent=" + searchContent;
    }
    if (paramSortBy) {
      appendFilterToURL += "&sortBy=" + paramSortBy;
    }
    if (paramFilterBy) {
      appendFilterToURL += "&filterBy=" + paramFilterBy;
    }
    showCategoryClearFilter = false;
    resetAllCheckboxes($('#filter-category-list input'));
  } else if (type == 'publisher') {
    if (paramContentType) {
      appendFilterToURL += "?contentType=" + paramContentType;
    } else {
      appendFilterToURL += "?contentType=all";
    }
    if (paramCategory) {
      appendFilterToURL += "&category=" + paramCategory;
    }
    if (searchContent) {
      appendFilterToURL += "&searchContent=" + searchContent;
    }
    if (paramSortBy) {
      appendFilterToURL += "&sortBy=" + paramSortBy;
    }
    if (paramFilterBy) {
      appendFilterToURL += "&filterBy=" + paramFilterBy;
    }
    showPublisherClearFilter = false;
    resetAllCheckboxes($('#filter-publisher-list input'));
  } else if (type == 'all') {
    appendFilterToURL += "?contentType=all";
    if (searchContent) {
      appendFilterToURL += "&searchContent=" + searchContent;
    }
    if (paramSortBy) {
      appendFilterToURL += "&sortBy=" + paramSortBy;
    }
    if (paramFilterBy) {
      appendFilterToURL += "&filterBy=" + paramFilterBy;
    }
    showContentTypeClearFilter = false;
    showCategoryClearFilter = false;
    showPublisherClearFilter = false;
    clearAllFilter = false;
    resetAllCheckboxes($('.sidebar-item input'));
    // document.getElementById('searchText').value = "";
    // document.getElementById('content-sort-by').value = "alphabetically";
    // document.getElementById('content-filter-by').value = "all";
    // searchContent = "";
    // paramSortBy = "";
    // paramFilterBy = "";

  }
  window.history.replaceState(null, null, appendFilterToURL);
  updateFilterButtons();
  filterContentByParams();
}

function resetAllCheckboxes(checkboxes){
  if(checkboxes && checkboxes.length > 0){
    _.each(checkboxes, function(checkbox){
      if(checkbox.checked){
        checkbox.click();
      }
    });
  } else {
    if(checkboxes.checked){
      checkboxes.click();
    }
  }
}

function init() {
  var contentHubPath = yumRepo + "content-hub/content-hub-web.json";
  var allItemsJson;
  $.getJSON('assets/resources.json', function(resourcesJson) {
    var resourcesJson = resourcesJson.resources;
    //Check headers last modified date
    httpGetHeaderInfo(contentHubPath, function(lastModifiedDate) {
      console.log(lastModifiedDate);
      if (!localStorage.hasOwnProperty('allItemsJsonlastModifiedDate')) {
        localStorageGetSetItem('set', 'allItemsJsonlastModifiedDate', lastModifiedDate);
      }
      var allItemsJsonlastModifiedDate = localStorageGetSetItem('get', 'allItemsJsonlastModifiedDate');
      
      if(localStorage.hasOwnProperty('allItemsJson')) {
        allItemsJson = localStorageGetSetItem('get', 'allItemsJson');
        allItemsJson = JSON.parse(allItemsJson);
      }
      
      if(allItemsJsonlastModifiedDate === lastModifiedDate && allItemsJson && allItemsJson.length > 0){
        allItemsJson = allItemsJson.concat(resourcesJson);
        updateContentOnPageLoad(allItemsJson);
      } else {
        localStorageGetSetItem('set', 'allItemsJsonlastModifiedDate', lastModifiedDate);
        var httpLoadContent = new XMLHttpRequest();
        httpLoadContent.open("GET", contentHubPath, false); // false for synchronous request
        httpLoadContent.send(null);
        var allItemsJsonResponse = httpLoadContent.responseText;
        localStorageGetSetItem('set', 'allItemsJson', allItemsJsonResponse);
        allItemsJson = localStorageGetSetItem('get', 'allItemsJson');
        allItemsJson = JSON.parse(allItemsJson);
        allItemsJson = allItemsJson.concat(resourcesJson);
        updateContentOnPageLoad(allItemsJson);
      }
    });
  });
}

function updateContentOnPageLoad(allItemsJson){
  if (window.location.href.indexOf('list.html') > -1) {
    loadSidebar();
  }
  var updatesList = [];
  var updatesCount = 0;
  //Descending Order for published date sorting
  var sortedAllItemsJson = _.sortBy(allItemsJson, function(item){
    if(item.publishedDate){
      return item.publishedDate * -1;
    }
  });
  _.each(sortedAllItemsJson, function (item) {
    var today = new Date();
    var priorDate = new Date(new Date().setDate(today.getDate() - 30));
    var last30DaysTimeStamp = Math.floor(priorDate.getTime() / 1000);
    if (item.publishedDate >= last30DaysTimeStamp && updatesCount < 18) {
      updatesList.push(item);
      updatesCount = updatesCount + 1;
    }
  });
  totalItems = allItemsJson.length;
  listItems = allItemsJson;
  listItemsBkp = listItems;
  if (window.location.href.indexOf('list.html') === -1 && window.location.href.indexOf('detail.html') === -1) {
    setTimeout(function () {
      buildUpdatesAvailableList(updatesList);
      buildFeaturedAvailableList(listItems);
    }, 100);
    buildHomePageBanners();
  }
  if (window.location.href.indexOf('list.html') > -1) {
    setTimeout(function () {
      filterContentByParams();
    }, 1000);
  }
  
  var mainPageLoader = $('.main-loader');
  if (mainPageLoader) {
    setTimeout(function () {
      $('.main-page-content').removeClass('d-none');
      mainPageLoader.addClass('d-none');
    }, 500);
    $('#carouselMain').carousel({ interval: 5000 });
    $('#carouselProductUpdates').carousel({ interval: false });
    $('#carouselUpdates').carousel({ interval: false });
    $('#carouselFeaturedUpdates').carousel({ interval: false });
  }
  
  setTimeout(function () {
    if (window.location.href.indexOf('list.html') > -1) {
      $('.list-loading').addClass('d-none');
      $('.all-list-content').removeClass('d-none');
    }
  }, 1000);
}

var initLoad = window.location.href.indexOf('connect.html') > -1 || window.location.href.indexOf('detail.html') > -1;

if (!initLoad) {
  init();
} else {
  showHomePageLink();
}

function applyFilter(item, value, filterType, from, e) {
  if(from === 'header'){
    e.preventDefault();
    e.stopPropagation();
  }
  reloadURLParams();
  var contentTypeParams;
  var categoryParams;
  var publisherParams;

  if (item.checked || item.className === 'nav-link' || item.className === 'nav-link text-light header-content-nav-link' || item.className === 'dropdown-item') {
    if (filterType === 'contentType') {
      contentTypeParams = updateFilterParams(paramContentType, value, 'add', 'contentType');
      categoryParams = paramCategory;
      publisherParams = paramPublisher;
      if(value === 'resources' || value === 'howtos' || value === 'datasheet' || value === 'demovideos'){
        updateContentSubTypeSelection('add', value);
      }
    } else if (filterType === 'category') {
      contentTypeParams = paramContentType;
      categoryParams = updateFilterParams(paramCategory, value, 'add', 'category');
      publisherParams = paramPublisher;
    } else if (filterType === 'publisher') {
      contentTypeParams = paramContentType;
      categoryParams = paramCategory;
      publisherParams = updateFilterParams(paramPublisher, value, 'add', 'publisher');
    }
  } else {
    if (filterType === 'contentType') {
      contentTypeParams = updateFilterParams(paramContentType, value, 'remove', 'contentType');
      categoryParams = paramCategory;
      publisherParams = paramPublisher;
      if(value === 'resources' || value === 'howtos' || value === 'datasheet' || value === 'demovideos'){
        updateContentSubTypeSelection('remove', value);
      }
    } else if (filterType === 'category') {
      contentTypeParams = paramContentType;
      categoryParams = updateFilterParams(paramCategory, value, 'remove', 'category');
      publisherParams = paramPublisher;
    } else if (filterType === 'publisher') {
      contentTypeParams = paramContentType;
      categoryParams = paramCategory;
      publisherParams = updateFilterParams(paramPublisher, value, 'remove', 'publisher');
    }
  }

  if(from === 'filter'){
    if (window.location.href.indexOf('list.html') === -1) {
      window.location.href = basePath + "/list.html?contentType=" + contentTypeParams;
    } else {
      var appendFilterToURL = appendFilterParamsToURL(contentTypeParams, categoryParams, publisherParams);
      window.history.replaceState(null, null, appendFilterToURL);
    }
  } else {
    contentTypeParams = value;
    if (window.location.href.indexOf('list.html') === -1) {
      window.location.href = basePath + "/list.html?contentType=" + contentTypeParams;
    } else {
      window.history.replaceState(null, null, basePath + "/list.html?contentType=" + contentTypeParams);
    }
    categoryParams = undefined;
    publisherParams = undefined;
    resetAllCheckboxes($('#filter-contenttype-list input'));
    resetAllCheckboxes($('#filter-category-list input'));
    resetAllCheckboxes($('#filter-publisher-list input'));
    showCategoryClearFilter = false;
    showPublisherClearFilter = false;
    $('#filter-contenttype-list input').filter(function(){return this.value === value}).click();
  }
  updateFilterButtons();
  filterContentByParams();
  if (filterType === 'contentType') {
    updateHeaderContentTypeLinks(value, from);
  }
}

function applySubContentFilter(item, value){
  if(item.checked){
    updateSubContentTypeParams('add', {'value': value, 'checked': item.checked});
  } else {
    updateSubContentTypeParams('remove', {'value': value, 'checked': item.checked});
  }
  var subContentLinks = $("#resources_subcontent_list input");
  var paramContentTypeAvailable = paramContentType.indexOf('resources') > -1;
  var allSubContentTypeSelected = true;
  _.each(subContentLinks, function(subContentLink){
    reloadURLParams();
    if(!subContentLink.checked) {
      allSubContentTypeSelected = false;
      if(paramContentTypeAvailable){
        $('#resources_content').removeAttr("checked");
        var contentTypeParams = updateFilterParams(paramContentType, 'resources', 'remove', 'contentType');
        updateSubcontentTypeURL(contentTypeParams);
        reloadURLParams();
      }
    }
    if(subContentLink.checked && !allSubContentTypeSelected && !paramContentType.indexOf(subContentLink.value) > -1){
      updateSubContentTypeParams('add', subContentLink);
    }
  });
  if(allSubContentTypeSelected){
    $('#resources_content').attr("checked", true);
    var contentTypeParams = updateFilterParams(paramContentType, 'resources', 'add', 'contentType');
    updateSubcontentTypeURL(contentTypeParams);
    _.each(subContentLinks, function(subContentLink){
      updateSubContentTypeParams('remove', subContentLink);
    });
  }
}

function appendFilterParamsToURL(contentTypeParams, categoryParams, publisherParams, searchString){
  var appendFilterToURL = basePath + "/list.html?contentType=" + contentTypeParams;
  if (categoryParams) {
    appendFilterToURL += "&category=" + categoryParams;
  }
  if (publisherParams) {
    appendFilterToURL += "&publisher=" + publisherParams;
  }
  if(searchContent || searchString){
    appendFilterToURL += (searchString || searchString === "") ? searchString : "&searchContent=" + searchContent;
  }
  if(paramSortBy){
    appendFilterToURL +="&sortBy=" + paramSortBy;
  }
  if(paramFilterBy){
    appendFilterToURL +="&filterBy=" + paramFilterBy;
  }
  showContentTypeClearFilter = (contentTypeParams && contentTypeParams !== 'all') ? true : false;
  showCategoryClearFilter = categoryParams ? true : false;
  showPublisherClearFilter = publisherParams ? true : false;
  return appendFilterToURL;
}

function updateHeaderContentTypeLinks(value, from) {
  var headerContentNavLink = $('.header-content-nav-link');
  _.each(headerContentNavLink, function (navLink) {
    if(navLink.className === 'nav-link header-content-nav-link active'){
      navLink.className = 'nav-link text-light header-content-nav-link';
    }
  });
  if(from === 'header' && value !== 'howtos' && value !== 'datasheet' && value !== 'demovideos'){
    $('#' + value + '-header-nav-link').removeClass('text-light');
    $('#' + value + '-header-nav-link').addClass('active');
  }
}

function updateFilterParams(data, item, method, type) {
  if ((data === 'all' || data === null) && method !== 'remove') {
    data = item;
  } else {
    var dataArray = data.split(',');
    var index = dataArray.indexOf(item);
    if (method === 'add' && index === -1) {
      data = data + ',' + item;
    } else if (method === 'remove') {
      if (index > -1) {
        dataArray.splice(index, 1);
      }
      var defaultValue = type === 'contentType' ? 'all' : null;
      data = dataArray.length > 0 ? dataArray.join(',') : defaultValue;
    }
  }
  return data;
}

function submitSearchFilter(event, type){
  var match = event.value;
  buildFilterList(type, true, match);
}

function filterContentByParams() {
  reloadURLParams();
  var filteredListItems = [];
  if (paramContentType || paramCategory || paramPublisher) {
    var contentTypeFilter = paramContentType.split(',');
    var categoryFilter = paramCategory ? paramCategory.split(',') : [];
    var publisherFilter = paramPublisher ? paramPublisher.split(',') : [];
    _.each(listItems, function (item) {
      _.each(contentTypeFilter, function (type) {
        if (item.type === type || type === 'all' || ((item.type === 'howtos' || item.type === 'datasheet' || item.type === 'demovideos') && type === 'resources')) {
          if (categoryFilter.length > 0 || publisherFilter.length > 0) {
            if (categoryFilter.length > 0) {
              _.each(categoryFilter, function (category) {
                if (item.category === category || item.category.indexOf(category) > -1) {
                  if (publisherFilter.length > 0) {
                    filteredListItems = filterByPublisher(publisherFilter, item, filteredListItems);
                  } else {
                    filteredListItems.push(item);
                  }
                }
              });
            } else {
              filteredListItems = filterByPublisher(publisherFilter, item, filteredListItems);
            }
          } else {
            filteredListItems.push(item);
          }
        }
      });
    });
  } else {
    filteredListItems = listItemsBkp;
  }
  if(paramSortBy || paramFilterBy) {
    filteredListItems = applySortByFilterBy(filteredListItems);
  }
  if(searchContent) {
    filteredListItems = getSearchFilteredData(searchContent, filteredListItems);
  }
  buildListData(filteredListItems, true);
}

function filterByPublisher(publisherFilter, item, filteredListItems){
  item.publisher = item.publisher ? item.publisher.replace(',', '') : item.publisher;
  _.each(publisherFilter, function (publisher) {
    if (item.publisher === publisher) {
      filteredListItems.push(item);
    }
  });
  return filteredListItems;
}

function applySortByFilterBy(filteredListItems){
  if(paramSortBy){
    var sortedAllItems;
    //Descending Order for published date sorting
    if(paramSortBy === 'createDate'){
      sortedAllItems = _.sortBy(filteredListItems, function(item){
        return item.publishedDate * -1;
      });
    } else {
      sortedAllItems = _.sortBy(filteredListItems, 'label');
    }
    filteredListItems = sortedAllItems;
  }
  if(paramFilterBy){
    var filteredAllItems;
    if(paramFilterBy === 'certified'){
      filteredAllItems = _.filter(filteredListItems, function(item){
        return item.certified;
      });
    } else {
      filteredAllItems = filteredListItems;
    }
    filteredListItems = filteredAllItems;
  }
  return filteredListItems;
}

function filterContent(types, latest) {
  var filteredListItems = [];
  if (types !== 'all') {
    types = types.split(',');
    _.each(listItems, function (item) {
      _.each(types, function (type) {
        if (item.type === type) {
          filteredListItems.push(item);
        }
      });
    });
  } else if (latest) {
    var todaysDate = new Date();
    todaysDate = todaysDate.getTime();

    _.each(listItems, function (item, index) {
      var time_difference = todaysDate - (item.published_date * 1000);
      time_difference = time_difference / (1000 * 60 * 60 * 24);
      if (time_difference > 0 && time_difference <= 15) {
        filteredListItems.push(item);
      }
    });
  } else {
    filteredListItems = listItemsBkp;
  }
  buildListData(filteredListItems, true);
}

function submitSearch() {
  var searchText = $("#searchText").val();
  var searchAlertBox = $(".custom-search-alert");
  if (searchText.length >= 3 || searchText.length === 0) {
    var searchParams = searchText.length >= 3 ? "&searchContent=" + searchText : "";
    if (window.location.href.indexOf('list.html') === -1 && searchText.length >= 3) {
      window.location.href = basePath + "/list.html?contentType=all" + searchParams;
    } else if (window.location.href.indexOf('list.html') > -1) {
      var appendFilterToURL = appendFilterParamsToURL(paramContentType, paramCategory, paramPublisher, searchParams);
      window.history.replaceState(null, null, appendFilterToURL);
      filterContentByParams();
    }
    searchAlertBox.removeClass("show");
  } else {
    searchAlertBox.addClass("show");
  }
}

function dismissSearchAlertBox() {
  $(".custom-search-alert").removeClass('show');
}

function searchContentData(match) {
  reloadURLParams();
  var searchedListItems = getSearchFilteredData(match, listItems, 'searchBox');
  buildListData(searchedListItems, true);
}

function getSearchFilteredData(match, allListItems, type) {
  var searchedListItems = [];
  _.each(allListItems, function (item) {
    var matchedResult = _.values(item).some(function (el) {
      if (typeof el === "string"){
        return el.toLowerCase().indexOf(match.toLowerCase()) > -1;
      }
    });
    if (type === 'searchBox' && paramContentType && paramContentType !== 'all') {
      if (paramContentType === item.type && matchedResult) {
        searchedListItems.push(item);
      }
    } else {
      if (matchedResult) {
        searchedListItems.push(item);
      }
    }
  });
  return searchedListItems;
}

function buildHomePageBanners() {
  var mainBanner = $("#main-carousel-content");
  var announcementsBanner = $("#carousel-announcement-content");
  var updatesBanner = $("#carousel-product-updates-content");
  var mainBannerIndicator = $("#main-carousel-indicators");
  var bannersJson = $.getJSON({ 'url': "assets/banners.json", 'async': false });
  bannersJson = JSON.parse(bannersJson.responseText);

  //Announcement banner
  _.each(bannersJson.announcementBanner, function (announcementBanner, index) {

    var announcementCarouselDiv = createNewDomElement('div', index === 0 ? "carousel-item active text-light" : "carousel-item text-light");

    var announcementCarouselRow = createNewDomElement('div', 'row');
    announcementCarouselDiv.appendChild(announcementCarouselRow);

    var announcementCarouselColumn = createNewDomElement('div', '');
    announcementCarouselRow.appendChild(announcementCarouselColumn);

    var announcementContent = createNewDomElement('div', 'd-flex justify-content-center mb-1 mt-1');

    var announcementHeading = createNewDomElement('h6', 'lh-base mb-0 me-1');
    announcementContent.appendChild(announcementHeading);

    var announcementHeadingText = document.createTextNode(announcementBanner.heading + ':');
    announcementHeading.appendChild(announcementHeadingText);

    var announcementSubHeading = createNewDomElement('p', 'fw-light mb-0 me-3');
    announcementContent.appendChild(announcementSubHeading);

    var announcementSubHeadingText = document.createTextNode(announcementBanner.subHeading);
    announcementSubHeading.appendChild(announcementSubHeadingText);

    var announcementHyperLink = createNewDomElement('a', 'pull-left text-center btn-link');
    announcementHyperLink.href = announcementBanner.hyperLink;
    announcementHyperLink.setAttribute("target", "_blank");
    announcementHyperLink.setAttribute("rel", "canonical");
    var announcementHyperLinkText = document.createTextNode(announcementBanner.hyperLinkText);
    announcementHyperLink.appendChild(announcementHyperLinkText);
    announcementContent.appendChild(announcementHyperLink);

    announcementCarouselColumn.appendChild(announcementContent);

    announcementsBanner.append(announcementCarouselDiv);
  });

  //Main Banner
  _.each(bannersJson.mainBanner, function (banner, index) {
    var carouselIndicatorButton = createNewDomElement('button', index === 0 ? "active" : "");
    var carouselId = "carouselMainCaptions" + index;
    carouselIndicatorButton.setAttribute("type", "button");
    carouselIndicatorButton.setAttribute("data-bs-target", "#carouselMain");
    carouselIndicatorButton.setAttribute("data-bs-slide-to", index);
    carouselIndicatorButton.setAttribute("aria-label", banner.heading);

    mainBannerIndicator.append(carouselIndicatorButton);

    var carouselDiv = createNewDomElement('div', index === 0 ? "carousel-item active" : "carousel-item");

    var carouselContainer = createNewDomElement('div', 'custom-left-offset-1 custom-right-offset-1');
    carouselDiv.appendChild(carouselContainer);

    var carouselRow = createNewDomElement('div', 'row');
    carouselRow.setAttribute("id", carouselId);
    carouselContainer.appendChild(carouselRow);

    var carouselColumn = createNewDomElement('div', 'col-auto carousel-col');
    carouselRow.appendChild(carouselColumn);

    var carouselHeading = createNewDomElement('h1', 'text-light fs-2');
    carouselColumn.appendChild(carouselHeading);

    var carouselHeadingText = document.createTextNode(banner.heading);
    carouselHeading.appendChild(carouselHeadingText);

    var carouselSubHeading = createNewDomElement('p', 'text-light fs-6');
    carouselColumn.appendChild(carouselSubHeading);

    var carouselSubHeadingText = document.createTextNode(banner.subHeading);
    carouselSubHeading.appendChild(carouselSubHeadingText);

    var carouselHyperLink = createNewDomElement('a', 'pull-left text-center btn btn-md');
    carouselHyperLink.href = banner.hyperLink.match(/https:/gi) ? banner.hyperLink : basePath + banner.hyperLink;
    carouselHyperLink.setAttribute("target", "_blank");
    carouselHyperLink.setAttribute("rel", "canonical");
    var carouselHyperLinkText = document.createTextNode(banner.hyperLinkText);
    carouselHyperLink.appendChild(carouselHyperLinkText);
    carouselColumn.appendChild(carouselHyperLink);

    mainBanner.append(carouselDiv);
  });

  //Updates banner
  var updatesCarouselCards = [];
  var updatesCarouselDiv;
  var updatesItemIndex = 0;
  var updatesCarouselIndex = 0;

  if(bannersJson.updatesBanner && bannersJson.updatesBanner.length <= 4 && $(window).width() > 450){
    $('#product-carousel-indicators').addClass('d-none');
  }
  _.each(bannersJson.updatesBanner, function (updateBanner) {

    var updateBannerCard = buildProductUpdatesCard(updateBanner);
    updatesCarouselCards.push(updateBannerCard);
    updatesItemIndex = updatesItemIndex + 1;
    if ($(window).width() <= 450) {
      updatesCarouselDiv = buildProductUpdatesCarousel(updatesCarouselCards, updatesCarouselIndex);
      updatesBanner.append(updatesCarouselDiv);
      updatesCarouselIndex = updatesCarouselIndex + 1;
      updatesCarouselCards = [];
    } else {
      if((bannersJson.updatesBanner.length < 4 && updatesItemIndex === bannersJson.updatesBanner.length) || (updatesCarouselIndex === 0 && updatesItemIndex === 4) || ((((updatesItemIndex/4) - 1) === updatesCarouselIndex)) || (bannersJson.updatesBanner.length === updatesItemIndex)) {
        updatesCarouselDiv = buildProductUpdatesCarousel(updatesCarouselCards, updatesCarouselIndex);
        updatesBanner.append(updatesCarouselDiv);
        updatesCarouselIndex = updatesCarouselIndex + 1;
        updatesCarouselCards = [];
      }
    }
  });
}

function buildProductUpdatesCard(updateBanner){

  var carouselBlock = createNewDomElement('div', 'col-md-3');

  var carouselHyperLink = createNewDomElement('a', 'text-decoration-none text-light');
  carouselHyperLink.href = updateBanner.hyperLink;
  carouselHyperLink.setAttribute("target", "_blank");
  carouselHyperLink.setAttribute("rel", "canonical");
  carouselBlock.appendChild(carouselHyperLink);

  var itemIconDiv = createNewDomElement('div', 'item-image');
  itemIconDiv.style.backgroundImage = "url(" + updateBanner.imagePath + ")";
  carouselHyperLink.appendChild(itemIconDiv);

  var carouselContent = createNewDomElement('div', 'update-item-details');

  var carouselSubHeading = createNewDomElement('h6', 'fw-light');
  carouselContent.appendChild(carouselSubHeading);

  var carouselSubHeadingText = document.createTextNode(updateBanner.subHeading);
  carouselSubHeading.appendChild(carouselSubHeadingText);

  var carouselHeading = createNewDomElement('h3');
  carouselHeading.setAttribute("title", updateBanner.heading);
  carouselContent.appendChild(carouselHeading);

  var carouselHeadingText = document.createTextNode(updateBanner.heading);
  carouselHeading.appendChild(carouselHeadingText);

  var carouselDescription = createNewDomElement('p');
  carouselDescription.setAttribute("title", updateBanner.description);
  carouselContent.appendChild(carouselDescription);

  var carouselDescriptionText = document.createTextNode(updateBanner.description);
  carouselDescription.appendChild(carouselDescriptionText);

  carouselHyperLink.appendChild(carouselContent);

  return carouselBlock;
}

function buildProductUpdatesCarousel(updateBannerCards, index) {
  var mainBannerIndicator = $("#product-carousel-indicators");
  var carouselIndicatorButton = createNewDomElement('button', index === 0 ? "active" : "");
  var carouselId = "carouselProductUpdates" + index;
  carouselIndicatorButton.setAttribute("type", "button");
  carouselIndicatorButton.setAttribute("data-bs-target", "#carouselProductUpdates");
  carouselIndicatorButton.setAttribute("data-bs-slide-to", index);
  carouselIndicatorButton.setAttribute("aria-label", "Product Updates Section" + index);

  mainBannerIndicator.append(carouselIndicatorButton);

  var carouselDiv = createNewDomElement('div', index === 0 ? "carousel-item active" : "carousel-item");

  var carouselRow = createNewDomElement('div', 'row');
  carouselRow.setAttribute("id", carouselId);
  carouselDiv.appendChild(carouselRow);

  _.each(updateBannerCards, function (updateBannerCard) {
    carouselRow.append(updateBannerCard);
  });

  return carouselDiv;
}

function buildUpdatesAvailableList(listData) {
  var carouselCards = [];
  var carouselDiv;
  var itemIndex = 0;
  var carouselIndex = 0;
  var marketPlaceUpdates = $("#latest-hub-updates");
  _.each(listData, function (listItem) {

    var mpCard = buildCardHtml(listItem, 'updates');
    carouselCards.push(mpCard);
    itemIndex = itemIndex + 1;
    
    if ($(window).width() <= 450) {
      carouselDiv = buildUpdatesCarousel(carouselCards, carouselIndex, "carouselUpdates", "latest-updates-carousel-indicators");
      marketPlaceUpdates.append(carouselDiv);
      carouselIndex = carouselIndex + 1;
      carouselCards = [];
    } else {
      if((listData.length < 6 && itemIndex === listData.length) || (carouselIndex === 0 && itemIndex === 6) || (carouselIndex === 1 && itemIndex <= 12 && itemIndex > 6 && itemIndex === (listData.length - 6)) || (carouselIndex === 2 && itemIndex <= 18 && itemIndex > 12  && itemIndex === listData.length)) {
        carouselDiv = buildUpdatesCarousel(carouselCards, carouselIndex, "carouselUpdates", "latest-updates-carousel-indicators");
        marketPlaceUpdates.append(carouselDiv);
        carouselIndex = carouselIndex + 1;
        carouselCards = [];
      }
    }

  });
}

function buildFeaturedAvailableList(listData) {
  var carouselCards = [];
  var carouselDiv;
  var itemIndex = 0;
  var carouselIndex = 0;
  var marketPlaceUpdates = $("#featured-hub-updates");

  var featuredAllItems = _.filter(listData, function(item){
    return item.featured;
  });

  if(featuredAllItems && featuredAllItems.length < 4 && $(window).width() > 450){
    $('#carouselFeaturedUpdates .carousel-control-prev').addClass('d-none');
    $('#carouselFeaturedUpdates .carousel-control-next').addClass('d-none');
    $('#featured-updates-carousel-indicators').addClass('d-none');
  }
  _.each(featuredAllItems, function (listItem) {
    var mpCard = buildCardHtml(listItem, 'updates');
    carouselCards.push(mpCard);
    itemIndex = itemIndex + 1;
    
    if ($(window).width() <= 450) {
      carouselDiv = buildUpdatesCarousel(carouselCards, carouselIndex, "carouselFeaturedUpdates", "featured-updates-carousel-indicators");
      marketPlaceUpdates.append(carouselDiv);
      carouselIndex = carouselIndex + 1;
      carouselCards = [];
    } else {
      if((featuredAllItems.length < 3 && itemIndex === featuredAllItems.length) || (carouselIndex === 0 && itemIndex === 3) || (carouselIndex === 1 && itemIndex <= 6 && itemIndex > 3 && itemIndex === (featuredAllItems.length - 3)) || (carouselIndex === 2 && itemIndex <= 9 && itemIndex > 6  && itemIndex === featuredAllItems.length)) {
        carouselDiv = buildUpdatesCarousel(carouselCards, carouselIndex, "carouselFeaturedUpdates", "featured-updates-carousel-indicators");
        marketPlaceUpdates.append(carouselDiv);
        carouselIndex = carouselIndex + 1;
        carouselCards = [];
      }
    }
  });
}

function buildUpdatesCarousel(mpCards, index, targetID, carouselID){
  var latestUpdatesIndicator = $("#" + carouselID);
  var latestUpdatesIndicatorButton = createNewDomElement('button', index === 0 ? "active" : "");
  var latestUpdatesId = targetID + "Captions" + index;
  latestUpdatesIndicatorButton.setAttribute("type", "button");
  latestUpdatesIndicatorButton.setAttribute("data-bs-target", "#"+targetID);
  latestUpdatesIndicatorButton.setAttribute("data-bs-slide-to", index);
  latestUpdatesIndicatorButton.setAttribute("aria-label", "Featured Updates Content " + index);

  latestUpdatesIndicator.append(latestUpdatesIndicatorButton);

  var carouselDiv = createNewDomElement('div', index === 0 ? "carousel-item active" : "carousel-item");

  var carouselRow = createNewDomElement('div', 'row');
  carouselRow.setAttribute("id", latestUpdatesId);
  carouselDiv.appendChild(carouselRow);

  _.each(mpCards, function (mpCard) {
    carouselRow.append(mpCard);
  });

  return carouselDiv;
}

function buildListData(listData, updateTotalCount) {
  var marketPlace = $("#marketplace-list");
  var contentCountElement = $("#content-count");
  marketPlace.html('');
  $(".mp-tile-container").remove();
  if(updateTotalCount){
    var totalContentCountElement = document.getElementById("totalContentCount");
    if(totalContentCountElement){
      totalContentCountElement.innerHTML = listData.length;
    }
  }
  $("#filteredContentCount").html(listData.length);
  if(listData.length === 0){
    var noResultDiv = createNewDomElement('div', 'h-100 m-5 mp-content-no-results text-center text-light muted');
    var noResultTitle = createNewDomElement('h4', 'mp-tile-title fw-lighter');
    var noResultText = document.createTextNode('No Results Found');
    noResultTitle.appendChild(noResultText);
    noResultDiv.appendChild(noResultTitle);
    marketPlace.append(noResultDiv);
    contentCountElement.addClass('d-none');
  } else {
    contentCountElement.removeClass('d-none');
  }
  _.each(listData, function (listItem) {
    var mpCard = buildCardHtml(listItem);
    marketPlace.append(mpCard);
  });
}

function buildCardHtml(listItem, mode) {
  if(mode === 'updates') {
    var divColTaglistItem = createNewDomElement('div', 'col-md-4 col-sm-6');
    var divTaglistItem = createNewDomElement('div', "mp-tile-container mp-tile-" + listItem.type + "-container");
    divColTaglistItem.appendChild(divTaglistItem);
  }

  var aTaglistItem = createNewDomElement('a');
  var entityName = encodeURIComponent(listItem.name);
  if(listItem.type === 'howtos' || listItem.type === 'datasheet' || listItem.type === 'demovideos'){
    if(listItem.subType === 'video'){
      aTaglistItem.href = "";
      aTaglistItem.addEventListener("click", function (e) {
        openVideoPopup(listItem, e);
      });
    } else {
      aTaglistItem.href = listItem.infoPath;
      aTaglistItem.setAttribute("target", "_blank");
      aTaglistItem.setAttribute("rel", "noopener noreferrer");
    }
    aTaglistItem.setAttribute("title", listItem.label);
  } else {
    aTaglistItem.href = basePath + "/detail.html?entity=" + entityName + "&version=" + listItem.version + "&type=" + listItem.type;
  }
  aTaglistItem.className = mode === 'updates' ? "text-light text-decoration-none" : "text-light mp-tile-container mp-tile-" + listItem.type + "-container";
  aTaglistItem.setAttribute("title", listItem.label);

  if(mode === 'updates') {
    var itemIconSpan = createNewDomElement('span', 'mp-content-type-icon pull-left');
    var itemIcon = createNewDomElement('i', "icon-" + listItem.type + "-type icon");
    itemIconSpan.appendChild(itemIcon);
    aTaglistItem.appendChild(itemIconSpan);
  }

  var itemType = createNewDomElement('p', 'mp-content-type');
  var itemTypeText = document.createTextNode(listItem.type === 'solutionpack' ? 'Solution Pack' : listItem.type === 'howtos' ? 'Product How To\'s' : listItem.type === 'demovideos' ? 'Demo Videos' : listItem.type === 'datasheet' ? 'FortiSOAR Kit' : listItem.type);
  itemType.appendChild(itemTypeText);
  aTaglistItem.appendChild(itemType);

  if(mode !== 'updates') {
    if(listItem.certified){
      var itemCertified = createNewDomElement('i', 'icon-featured-badge position-absolute text-success top-position-10 right-position-10');
      itemCertified.setAttribute("title", "Certified");
      aTaglistItem.appendChild(itemCertified);
    }
    var itemIconDiv = createNewDomElement('div', 'mp-tile-image-container');

    var imageElement;
    if (listItem.iconLarge) {
      imageElement = createNewDomElement('img', 'mp-tile-image');
      imageElement.src = yumRepo + listItem.iconLarge;
      imageElement.setAttribute("width", "85");
      imageElement.setAttribute("height", "auto");
      imageElement.setAttribute("loading", "lazy");
    } else {
      if(listItem.type === 'datasheet'){
        imageElement = createNewDomElement('i', "mp-tile-icon fa fa-3x mp-tile-icon text-black " + listItem.icon);
      } else {
        imageElement = createNewDomElement('i', "mp-tile-icon icon-" + listItem.type + "-large");
      }
    }

    itemIconDiv.appendChild(imageElement);
    aTaglistItem.appendChild(itemIconDiv);
  }

  var itemContentDiv = createNewDomElement('div', 'mp-content-fixed-height');

  var itemTitle = createNewDomElement('h4', 'mp-tile-title');
  var itemTitleText = document.createTextNode(listItem.label || listItem.display);
  itemTitle.appendChild(itemTitleText);
  itemContentDiv.appendChild(itemTitle);

  var itemDetailsDiv = createNewDomElement('div', 'mp-tile-details');

  var itemVersion = createNewDomElement('p', 'm-0');
  var itemVersionTag = document.createElement('span');
  if(listItem.type === 'howtos' || listItem.type === 'datasheet' || listItem.type === 'demovideos'){
    var itemTypeTagText = document.createTextNode("Type: ");
    itemVersionTag.appendChild(itemTypeTagText);
    itemVersion.appendChild(itemVersionTag);
    var itemTypeText = document.createTextNode((listItem.type === 'howtos' || listItem.type === 'demovideos') ? 'Video' : listItem.subTypeTitle);
    itemVersion.appendChild(itemTypeText);
  } else {
    var itemVersionTagText = document.createTextNode("Version: ");
    itemVersionTag.appendChild(itemVersionTagText);
    itemVersion.appendChild(itemVersionTag);
    var itemVersionText = document.createTextNode(listItem.version);
    itemVersion.appendChild(itemVersionText);
  }
  itemDetailsDiv.appendChild(itemVersion);

  if(listItem.publisher){
    var itemPublisher = createNewDomElement('p', 'm-0');
    var itemPublisherTag = document.createElement('span');
    var itemPublisherTagText = document.createTextNode("Published By: ");
    itemPublisherTag.appendChild(itemPublisherTagText);
    itemPublisher.appendChild(itemPublisherTag);
    var itemPublisherText = document.createTextNode(listItem.publisher);
    itemPublisher.appendChild(itemPublisherText);
    itemDetailsDiv.appendChild(itemPublisher);
  }
  
  itemContentDiv.appendChild(itemDetailsDiv);
  aTaglistItem.appendChild(itemContentDiv);

  var cardDescription = createNewDomElement('p', 'mp-tile-description muted-80');
  listItem.description = listItem.description ? listItem.description : '';
  var tooltipDesc = listItem.description.replace(/(<([^>]+)>)/gi, "");
  cardDescription.setAttribute("title", tooltipDesc);
  cardDescription.innerHTML = listItem.description;
  aTaglistItem.appendChild(cardDescription);

  if(mode === 'updates'){
    var itemButton = createNewDomElement('button', 'btn btn-outline-light mt-3');
    var itemButtonText = document.createTextNode("Learn More");
    itemButton.appendChild(itemButtonText);
    aTaglistItem.appendChild(itemButton);
    divTaglistItem.appendChild(aTaglistItem);
    return divColTaglistItem;
  } else {
    return aTaglistItem;
  }
}

function toggleFilter(e) {
  var event = $(e);
  if (event.hasClass('active')) {
    event.removeClass('active');
    $('.sidebar').addClass('d-none');
    $('body').removeClass('overflow-hidden');
  } else {
    event.addClass('active');
    $('.sidebar').removeClass('d-none');
    $('body').addClass('overflow-hidden');
  }
}

function getUrlParameter(sParam) {
  var sPageURL = window.location.search.substring(1),
    sURLVariables = sPageURL.split('&'),
    sParameterName,
    i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=');

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
    }
  }
  return null;
};

function httpGetHeaderInfo(theUrl, callback){
  http.open('HEAD', theUrl);
  http.onreadystatechange = function() { 
      if (http.readyState == 4 && http.status == 200) {
        var lastModifiedDate = http.getResponseHeader("Last-Modified");
        callback(lastModifiedDate);
      }
  }
  http.send();
};

function showHomePageLink(){
  setTimeout(function () {
    $('#topbar-home-link').removeClass('d-none');
    $('#topbar-home-link').addClass('d-inline-block');
  }, 10);
}

function toggleTheme(theme) {
  var toggleThemeBtn = document.getElementById("toggle-theme-btn");
  if(!theme){
    theme = toggleThemeBtn.classList.contains('dark-mode-active') ? 'Light Theme' : 'Dark Theme'
  }
  setTheme(theme, toggleThemeBtn);
}

function setTheme(theme, toggleThemeBtn){
  var mainContentWrapper = document.getElementById("main-content-wrapper");
  var dropdownMenuElements = $('.dropdown-menu');
  if(theme === 'Dark Theme'){
    toggleThemeBtn.classList.add('dark-mode-active');
    toggleThemeBtn.classList.remove('light-mode-active');
    toggleThemeBtn.title = 'Toggle Light Theme';
    toggleThemeBtn.children[0].classList.add('icon-light-mode');
    toggleThemeBtn.children[0].classList.remove('icon-dark-mode');
    mainContentWrapper.classList.remove('light-theme-applied');
    localStorageGetSetItem('set', 'themeApplied', 'Dark Theme');
    _.each(dropdownMenuElements, function (dropdownMenu) {
      dropdownMenu.classList.add('dropdown-menu-dark');
    });
  } else {
    toggleThemeBtn.classList.remove('dark-mode-active');
    toggleThemeBtn.classList.add('light-mode-active');
    toggleThemeBtn.title = 'Toggle Dark Theme';
    toggleThemeBtn.children[0].classList.remove('icon-light-mode');
    toggleThemeBtn.children[0].classList.add('icon-dark-mode');
    mainContentWrapper.classList.add('light-theme-applied');
    localStorageGetSetItem('set', 'themeApplied', 'Light Theme');
    _.each(dropdownMenuElements, function (dropdownMenu) {
      dropdownMenu.classList.remove('dropdown-menu-dark');
    });
  }
}

function createNewDomElement(elementType, elementClasses){
  var element = document.createElement(elementType);
  if(elementClasses){
    element.className = elementClasses;
  }
  return element;
}

function localStorageGetSetItem(type, item, value){
  if(type === 'get'){
    return localStorage.getItem(item);
  } else {
    localStorage.setItem(item, value);
  }
}

/* When the user scrolls down, hide the navbar. When the user scrolls up, show the navbar */
var prevScrollpos = window.pageYOffset;
window.onscroll = function() {
  var listingPageTopContent = document.getElementById("listing-page-top-content");
  if(listingPageTopContent){
    var currentScrollPos = window.pageYOffset;
    if (prevScrollpos > currentScrollPos) {
      listingPageTopContent.style.display = "none";
      document.getElementById("listing-page-banner-content").style.display = "block";
    } else {
      document.getElementById("listing-page-top-content").style.display = "block";
      listingPageTopContent.style.display = "none";
    }
    prevScrollpos = currentScrollPos;
  }
}

//sort by on listing page
$('#content-sort-by').change(function(){
  reloadURLParams();
  if(paramSortBy){
    var urlParams = new URLSearchParams(window.location.search);
    urlParams.set('sortBy', this.value);
    window.location.search = urlParams;
  } else {
    var url = window.location.href;
    url = url + '&sortBy=' + this.value;
    window.history.replaceState(null, null, url);
  }
  filterContentByParams();
});

//filter by on listing page
$('#content-filter-by').change(function(){
  reloadURLParams();
  if(paramFilterBy){
    var urlParams = new URLSearchParams(window.location.search);
    urlParams.set('filterBy', this.value);
    window.location.search = urlParams;
  } else {
    var url = window.location.href;
    url = url + '&filterBy=' + this.value;
    window.history.replaceState(null, null, url);
  }
  filterContentByParams();
});

function toggleSubmenu(e) {
  e.preventDefault();
  e.stopPropagation();
}

function openVideoPopup(item, e){
  var videoPopupModal = $('#videoPopupModal');
  $(videoPopupModal).find('.modal-title').html(item.label);
  $("#videoLink").attr('src', item.infoPath);
  if ($(window).width() <= 450) {
    $("#videoLink").attr('width', 'auto');
    $("#videoLink").attr('height', 'auto');
    $(videoPopupModal).find('.modal-body').addClass('text-center');
  }
  $(videoPopupModal).modal('show');
  e.preventDefault();
  e.stopPropagation();
}

function closeVideoPopup(){
  $('#videoPopupModal').modal('hide')
  $("#videoLink").attr('src', '');
}

//navigation to contributors page
function navigateToContributors(e,page){
  e.preventDefault();
  e.stopPropagation();
  var _url = basePath + "/contributors.html";
  window.location.href = _url;
}

$('#carouselUpdates .carousel-control-prev').click(function() {
  $('#carouselUpdates').carousel('prev');
});

$('#carouselUpdates .carousel-control-next').click(function() {
  $('#carouselUpdates').carousel('next');
});

$('#carouselFeaturedUpdates .carousel-control-prev').click(function() {
  $('#carouselFeaturedUpdates').carousel('prev');
});

$('#carouselFeaturedUpdates .carousel-control-next').click(function() {
  $('#carouselFeaturedUpdates').carousel('next');
});

