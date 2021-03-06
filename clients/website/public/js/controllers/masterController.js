angular.module("voiceOf.controllers")
        .controller('MasterController', ['$scope', '$rootScope', 'api', '$upload', '$window', function ($scope, $rootScope, api, $upload, $window)
            {
                //selected file in scope
                $scope.selFile = null;
                //Check it is a valid location
                $scope.validLocation = null;
                //Show command for specific post

                $scope.nickname = "User";

                $scope.post = {};

                $scope.refreshPins = function (location) {
                    $scope.setUserName();                   
                    
                    // ignore if location was null
                    if(!location || location===null)return;
                    
                    var url = "?lat=" + location.lat + "&lng=" + location.lng + "&rad=" + ($window.distanceRadius);                    
                    api.getAllpost(url, function (err, data) {
                        if (err) {
                            console.log(err);
                            if ($window.mresults)
                                $window.mresults.length = 0;
                            $window.rearrangeMarkers(location);
                        } else {
                            $window.mresults = data;
                            $window.rearrangeMarkers(location);
                        }
                    });
                };

                $scope.showDetailPost = function (index) {
                    showDetailPopup($window.mresults[index]._id);
                    $('#postDetails').modal();                      // initialized with defaults
                    $('#postDetails').modal({keyboard: false});   // initialized with no keyboard
                    $('#postDetails').modal('show');
                };
                $scope.checkLocationAvailable = function () {
                    if ($("#addressMsg").val().length == 0) {
                        alert("Please enter location");
                        return;
                    }
                    api.checkLocationAvailable(function (err, data) {
                        ga('send', 'event', 'Post message', 'click', 'Location search');
                        if (data.results.length == 0) {
                            $scope.validLocation = false;
                        } else {
                            $scope.validLocation = true;
                            $scope.resultLat = data.results[0].geometry.location.lat;
                            $scope.resultLan = data.results[0].geometry.location.lng;
                            $scope.searchLocation = {lat: $scope.resultLat, lng: $scope.resultLan};

                            //clear marker and pin marker
                            $scope.setMapOnAll(null, $scope.searchLocation);
                        }
                    });
                };
                $scope.setCurrentLoc = function () {
                    ga('send', 'event', 'Post message', 'click', 'Current location');
                    //clear marker and pin marker
                    $scope.setMapOnAll(null, currentLocation);
                    $scope.validLocation = null;
                    $scope.locationTxt = "";
                };
                $scope.setMapOnAll = function (val, location) {
                    for (var i = 0; i < markers.length; i++) {
                        markers[i].setMap(val);
                    }
                    markers = [];
                    map.setCenter(location);
                    var userMarker = new google.maps.Marker({
                        position: location,
                        map: map,
                        title: 'Your Current Location'
                    });
                    markers.push(userMarker);
                };
                //Select artifact
                $scope.selectArtifact = function () {
                    angular.element("#artifact_upload").click();
                };
                //Keep selected file
                $scope.fileSelected = function ($files) {
                    ga('send', 'event', 'Post message', 'click', 'Upload post with media');
                    $scope.selFile = $files[0];
                };

                //Submit post
                $scope.postSubmit = function () {
                    ga('send', 'event', 'Post message', 'click', 'Send post');
                    $("#apploader").show();
                    if (!getCookie('userSessionToken')) {
                        alert("Please refresh the page and do login to post your query....");
                        $("#apploader").hide();
                        return;
                    }
                    if ($('#txtMsg').val() == "") {
                        alert("Please enter message.");
                        $("#apploader").hide();
                        return;
                    }


                    if ($scope.validLocation) {
                        var jsonData = {content: {msg: $scope.txtMessage, stayAnonmous: $('#stayAnoVal').is(':checked')}, position: [$scope.resultLan, $scope.resultLat]};
                    } else {
                        var jsonData = {content: {msg: $scope.txtMessage, stayAnonmous: $('#stayAnoVal').is(':checked')}, position: [currentLocation.lng, currentLocation.lat]};
                    }

                    api.submitPost(jsonData, $scope.selFile, function (err, data) {
                        ga('send', 'event', 'Post message', 'click', 'Post message');
                        if (data != null) {
                            $scope.locationTxt = "";
                            $scope.txtMessage = "";
                            $scope.selFile = null;
                            alert("Your shout tweeted!");
                            $("#apploader").hide();
                            $scope.refreshPins({lat: jsonData.position[1], lng: jsonData.position[0]});
                        } else {
                            alert("Unable to process. Please try again.");
                        }
                    });
                };

//Remove selected file
                $scope.removeSelFile = function () {
                    $scope.selFile = null;
                };


                //Remove selected file
                $scope.removeSelFile = function () {
                    $scope.selFile = null;
                };

                $scope.openfbContent = function () {
                    try {
                        var variable = "sharedurl";
                        var sharedID = "";
                        var query = "";
                        query = "" + window.location;//hosted check
                        //query = "https://chillana.in/?sharedurl=5675109d37a24203000dc1b7";//local check

                        /*var vars = query.split("?");
                        for (var i = 0; i < vars.length; i++) {
                            var pair = vars[i].split("=");
                            if (pair[0] == variable) {
                                sharedID = pair[1];
                            }
                        } */ 
                        sharedID = getParameterByName(variable);
                    sharedID = sharedID.replace('#','');
                    if(sharedID){
                        showDetailPopup(sharedID);
                    }
                 }catch(e){
                     console.log("openfbContent Error: "+e);
                 }
                };
                
                var getParameterByName = function (name) {
                        var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
                        return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
                };


                var showDetailPopup = function (postID) {
                    if (!postID)
                        return;
                    $("#apploader").show();
                    $scope.post._id = ""; // reset to get new comments 
                    $scope.post.comments = [];
                    api.getPostByID(postID, function (err, data) {
                        $("#apploader").hide();
                        if (err) {
                            console.log("showDetailPopup error: " + JSON.stringify(err));
                        } else {
                            $scope.showSingleDetailPost(data);
                        }
                    });
                };

                $scope.showSingleDetailPost = function (postObj) {
                    //$scope.$apply(function () {                        
                    $scope.post = postObj;
                    $scope.post.jsonContent = $scope.post.content;
                    //});
                    $('#postDetails').modal();                      // initialized with defaults
                    $('#postDetails').modal({keyboard: false});   // initialized with no keyboard
                    $('#postDetails').modal('show');
                };

                angular.element(document).ready(function () {
                    $scope.openfbContent();
                });

                $scope.setUserName = function () {
                    var username = getCookie('nickname');
                    try {
                        if (username) {
                            $scope.nickname = username;
                        } else {
                            $scope.nickname = "User";
                        }
                    } catch (e) {
                        console.log("setUserName error: " + e);
                    }
                };

            }]);