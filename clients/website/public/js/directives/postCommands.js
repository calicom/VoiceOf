voiceOf.directive("voCommands", ['api', '$window', function (api, $window)
    {
        var directive = {
            restrict: 'E',
            templateUrl: 'views/postCommands.html',
            scope: {
                post: "=post"
            },
            link: function ($scope) {
                $scope.cmdSelFile = null;
                //On file select, save file in scope varible
                $scope.cmdfileSelected = function ($files) {
                    $scope.cmdSelFile = $files[0];
                };

                $scope.showCommentsLoading = false;
                $scope.getComments = function () {
                    if (!$scope.post._id)
                        return;
                    $scope.showCommentsLoading = true;
                    api.getAllComments($scope.post._id, function (err, data) {
                        $scope.showCommentsLoading = false;
                        if (err) {
                            console.log(err);
                        } else {                            
                            $scope.post.comments = data;
                        }
                    });
                };                

                //Post commands
                $scope.postCommand = function () {
                    if ($scope.cmdLoad == true)
                        return;
                    if ($('#cmdTxt').val() == "") {
                        alert("Please type your message");
                        return;
                    }
                    $scope.cmdLoad = true;
                    api.postCommand($scope.post._id, $scope.cmdSelFile, function (err, data) {
                        if (data != null) {
                            $scope.cmdSelFile = null;
                            $scope.cmdTxt = "";
                            alert("Comment posted.");
                            $scope.getComments();
                        } else {
                            alert("Unable to process. Please try again.");
                            console.log(err);
                        }
                        $scope.cmdLoad = false;
                    });
                };

                //Remove selected file
                $scope.removeCmdSelFile = function () {
                    $scope.cmdSelFile = null;
                };
                $scope.openFbPopUp = function () {
                    var postObj = $scope.post;
                    //alert((postObj === 'undefined')?"true":"false");
                    //alert(JSON.stringify(postObj));
                    //postObj = JSON.parse(postObj);
                    //console.log(JSON.stringify(content1));
                    //console.log("openFbPopUp called...");
                    try {
                        FB.ui(
                                {
                                    method: 'feed',
                                    name: 'Facebook Share',
                                    //link: 'https://chillana.in',
                                    //link: 'http://localhost:3000?sharedurl=5675109d37a24203000dc1b7',
                                    link: 'https://www.voiceof.in?sharedurl=' + postObj.slug,
                                    picture: 'https://www.voiceof.in/img/logo.png',
                                    caption: 'blogs.voiceof.in',
                                    description: "VoiceOf.in - It's a tool for the government for the People by the Youth. Post your problems at the location you see. Let's clean up the city together"
                                },
                        function (response) {
                            if (response && response.post_id) {
                                alert('Post was published successful.');
                            } else {
                                alert('Post was not published.');
                            }
                        }
                        );
                    } catch (e) {
                        alert(e);
                    }
                };
                $scope.voteInprogress = false;
                $scope.votePosted = false;                
                $scope.voteInit = function () {
                    $scope.votePosted = ($scope.post.votes && $scope.post.votes.indexOf(getCookie('userID'))>=0);                    
                };
                $scope.votePost = function () {                    
                    $("#apploader").show();
                    var postObj = $scope.post;
                    var postid = postObj._id;
                    console.log("votePost ID: " + postid);
                    $scope.voteInprogress = true;
                    api.votePost(postid, function (err, data) {
                        $scope.voteInprogress = false;
                        $("#apploader").hide();
                        if (err) {
                            console.log("votePost Error: " + err);
                        } else {
                            var userID = getCookie('userID'); 
                            if(!$scope.post.votes || $scope.post.votes===null){
                                $scope.post.votes = [];
                            }
                            $scope.post.votes.push(userID);                            
                            $scope.votePosted = true;
                            console.log("votePost response: " + data);
                            //$window.mresults = data;

                            //$window.rearrangeMarkers(location);
                            console.log("votePost Success");
                        }
                    });
                };

                //Change post status to complete
                $scope.postComplete = function () {
                    api.postComplete($scope.post._id, function (err, data) {
                        if (data != null) {
                            var mylocation = map.getCenter();
                            var location = JSON.parse(JSON.stringify(mylocation));

                            var url = "?lat=" + location.lat + "&lng=" + location.lng + "&rad=" + ($window.distanceRadius);
                            console.log(url);
                            api.getAllpost(url, function (err, data) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    $window.mresults = data;

                                    $window.rearrangeMarkers(location);

                                }
                                alert("Post Completed.");
                            });
                        } else {
                            alert("Unable to process. Please try again.");
                        }
                    });
                };
                
                $scope.$watch('post._id', function (newval, oldval) {
                    $scope.getComments();
                    $scope.voteInit();
                });
            }
        };
        return directive;
    }]);