// Copyright 2017 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Directive for a set of audio controls for a specific
 * audio translation in the learner view.
 */

oppia.directive('audioBar', [
  'UrlInterpolationService', 'AudioPreloaderService',
  function(UrlInterpolationService, AudioPreloaderService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_player/' +
        'audio_bar_directive.html'),
      controller: [
        '$scope', '$interval', '$timeout', 'AudioTranslationLanguageService',
        'AudioPlayerService', 'LanguageUtilService', 'AssetsBackendApiService',
        'AutogeneratedAudioPlayerService', 'PlayerPositionService',
        'WindowDimensionsService', 'AudioTranslationManagerService',
        'EVENT_AUTOPLAY_AUDIO', 'BrowserCheckerService',
        function(
            $scope, $interval, $timeout, AudioTranslationLanguageService,
            AudioPlayerService, LanguageUtilService, AssetsBackendApiService,
            AutogeneratedAudioPlayerService, PlayerPositionService,
            WindowDimensionsService, AudioTranslationManagerService,
            EVENT_AUTOPLAY_AUDIO, BrowserCheckerService) {
          $scope.audioBarIsExpanded = false;
          $scope.hasPressedPlayButtonAtLeastOnce = false;

          $scope.languagesInExploration =
            AudioTranslationLanguageService.getLanguageOptionsForDropdown();
          $scope.selectedLanguage = {
            value:
             AudioTranslationLanguageService.getCurrentAudioLanguageCode()
          };

          $scope.$on(EVENT_AUTOPLAY_AUDIO, function(e, params) {
            if ($scope.audioBarIsExpanded) {
              AudioPlayerService.stop();
              AutogeneratedAudioPlayerService.cancel();

              // We use a timeout to allow for any previous audio to have
              // their 'onend' callback called. This is primarily used to
              // address delays with autogenerated audio callbacks.
              $timeout(function() {
                if (params) {
                  AudioTranslationManagerService.setSecondaryAudioTranslations(
                    params.audioTranslations,
                    params.html,
                    params.componentName);
                }
                $scope.onPlayButtonClicked();
              }, 100);
            }
          });

          $scope.isAudioBarAvailable = function() {
            return $scope.languagesInExploration.length > 0;
          };

          $scope.onNewLanguageSelected = function() {
            AudioTranslationLanguageService.setCurrentAudioLanguageCode(
              $scope.selectedLanguage.value);
            AudioPlayerService.stop();
            AudioPlayerService.clear();
            AutogeneratedAudioPlayerService.cancel();
            if ($scope.isAudioAvailableInCurrentLanguage() &&
                !isAutogeneratedLanguageCodeSelected()) {
              var audioTranslation =
                getAudioTranslationInCurrentLanguage();
              AudioPreloaderService.setMostRecentlyRequestedAudioFilename(
                audioTranslation.filename);
              AudioPreloaderService.restartAudioPreloader(
                PlayerPositionService.getCurrentStateName());
            }
          };

          $scope.expandAudioBar = function() {
            $scope.audioBarIsExpanded = true;
          };

          $scope.collapseAudioBar = function() {
            $scope.audioBarIsExpanded = false;
            AudioPlayerService.stop();
            AudioPlayerService.clear();
            AutogeneratedAudioPlayerService.cancel();
          };

          var lastScrollTop = 0;

          $(window)
            .scroll(function(event) {
              if (WindowDimensionsService.isWindowNarrow()) {
                updateAudioHeaderPosition();
              }
            });

          var updateAudioHeaderPosition = function() {
            var scrollTop = $(this)
              .scrollTop();
            var audioHeader = angular.element($('.audio-header:first'));
            if (scrollTop > lastScrollTop) {
              audioHeader.addClass('audio-bar-nav-up');
              if (!$scope.audioBarIsExpanded) {
                audioHeader.addClass('audio-bar-nav-hidden');
              }
            } else if (scrollTop === 0 ||
                       scrollTop + $(window)
                         .height() < $(document)
                         .height()) {
              audioHeader.removeClass('audio-bar-nav-up');
              audioHeader.removeClass('audio-bar-nav-hidden');
            }
            lastScrollTop = scrollTop;
          };

          var getCurrentAudioLanguageCode = function() {
            return AudioTranslationLanguageService
              .getCurrentAudioLanguageCode();
          };

          $scope.getCurrentAudioLanguageDescription = function() {
            return AudioTranslationLanguageService
              .getCurrentAudioLanguageDescription();
          };

          var getAudioTranslationInCurrentLanguage = function() {
            return AudioTranslationManagerService.getCurrentAudioTranslations()[
              AudioTranslationLanguageService.getCurrentAudioLanguageCode()];
          };

          $scope.isAudioPlaying = function() {
            return AudioPlayerService.isPlaying() ||
              AutogeneratedAudioPlayerService.isPlaying();
          };

          $scope.audioLoadingIndicatorIsShown = false;

          $scope.AudioPlayerService = AudioPlayerService;

          $scope.isAudioAvailableInCurrentLanguage = function() {
            return Boolean(getAudioTranslationInCurrentLanguage()) ||
              isAutogeneratedLanguageCodeSelected();
          };

          $scope.doesCurrentAudioTranslationNeedUpdate = function() {
            if (!isAutogeneratedLanguageCodeSelected()) {
              var audioTranslation = getAudioTranslationInCurrentLanguage();
              return (audioTranslation && audioTranslation.needsUpdate);
            } else {
              return false;
            }
          };

          var isAutogeneratedLanguageCodeSelected = function() {
            return AudioTranslationLanguageService
              .isAutogeneratedLanguageCodeSelected();
          };

          $scope.onPlayButtonClicked = function() {
            $scope.hasPressedPlayButtonAtLeastOnce = true;
            if (isAutogeneratedLanguageCodeSelected()) {
              playPauseAutogeneratedAudioTranslation();
            } else {
              var audioTranslation = getAudioTranslationInCurrentLanguage();
              if (audioTranslation) {
                playPauseUploadedAudioTranslation(
                  getCurrentAudioLanguageCode());
              }
            }
          };

          $scope.track = {
            progress: function(progressPercentage) {
              // Returns the current track progress. In addition, sets the
              // track progress if the progressPercentage argument is defined.
              if (angular.isDefined(progressPercentage)) {
                AudioPlayerService.setProgress(progressPercentage / 100);
              }
              return AudioPlayerService.getProgress() * 100;
            }
          };

          var isCached = function(audioTranslation) {
            return AssetsBackendApiService.isCached(audioTranslation.filename);
          };

          var playPauseAudioTranslation = function(languageCode) {
            if (AudioTranslationLanguageService
              .isAutogeneratedLanguageCodeSelected()) {
              playPauseAutogeneratedAudioTranslation();
            } else {
              playPauseUploadedAudioTranslation(languageCode);
            }
          };

          var playPauseAutogeneratedAudioTranslation = function() {
            // SpeechSynthesis in Chrome seems to have a bug
            // where if you pause the utterance, wait for around
            // 15 or more seconds, then try resuming, nothing
            // will sound. As a temporary fix, just restart the
            // utterance from the beginning instead of resuming.
            if (AutogeneratedAudioPlayerService.isPlaying()) {
              AutogeneratedAudioPlayerService.cancel();
            } else {
              AutogeneratedAudioPlayerService.play(
                AudioTranslationManagerService
                  .getCurrentHtmlForAutogeneratedAudio(),
                AudioTranslationLanguageService
                  .getSpeechSynthesisLanguageCode(),
                function() {
                  // Used to update bindings to show a silent speaker after
                  // autogenerated audio has finished playing.
                  $scope.$applyAsync();
                  AudioTranslationManagerService
                    .clearSecondaryAudioTranslations();
                });
            }
          };

          var playPauseUploadedAudioTranslation = function(languageCode) {
            if (!AudioPlayerService.isPlaying()) {
              if (AudioPlayerService.isTrackLoaded()) {
                AudioPlayerService.play();
              } else {
                loadAndPlayAudioTranslation();
              }
            } else {
              AudioPlayerService.pause();
            }
          };

          var playCachedAudioTranslation = function(audioFilename) {
            AudioPlayerService.load(audioFilename)
              .then(function() {
                $scope.audioLoadingIndicatorIsShown = false;
                AudioPlayerService.play();
              });
          };

          /**
           * Called when an audio file finishes loading.
           * @param {string} audioFilename - Filename of the audio file that
           *                                 finished loading.
           */
          var onFinishedLoadingAudio = function(audioFilename) {
            var mostRecentlyRequestedAudioFilename =
              AudioPreloaderService.getMostRecentlyRequestedAudioFilename();
            if ($scope.audioLoadingIndicatorIsShown &&
                audioFilename === mostRecentlyRequestedAudioFilename) {
              playCachedAudioTranslation(audioFilename);
            }
          };

          AudioPreloaderService.setAudioLoadedCallback(onFinishedLoadingAudio);

          var loadAndPlayAudioTranslation = function() {
            $scope.audioLoadingIndicatorIsShown = true;
            var audioTranslation = getAudioTranslationInCurrentLanguage();
            AudioPreloaderService.setMostRecentlyRequestedAudioFilename(
              audioTranslation.filename);
            if (audioTranslation) {
              if (isCached(audioTranslation)) {
                playCachedAudioTranslation(
                  audioTranslation.filename);
              } else if (!AudioPreloaderService.isLoadingAudioFile(
                audioTranslation.filename)) {
                AudioPreloaderService.restartAudioPreloader(
                  PlayerPositionService.getCurrentStateName());
              }
            }
          };
        }
      ]
    };
  }
]);
