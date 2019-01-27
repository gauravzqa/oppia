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
 * @fileoverview Utility service for checking web browser type.
 */

oppia.factory('BrowserCheckerService', [
  'AUTOGENERATED_AUDIO_LANGUAGES',
  function(AUTOGENERATED_AUDIO_LANGUAGES) {
    // For details on the reliability of this check, see
    // https://stackoverflow.com/questions/9847580/
    // how-to-detect-safari-chrome-ie-firefox-and-opera-browser#answer-9851769
    var isSafari = /constructor/i.test(window.HTMLElement) || (
      function(p) {
        return p.toString() === '[object SafariRemoteNotification]';
      })(
      !window.safari ||
        (typeof safari !== 'undefined' && safari.pushNotification)
    );

    var _supportsSpeechSynthesis = function() {
      supportLang = false;
      if (window.hasOwnProperty('speechSynthesis')) {
        speechSynthesis.getVoices()
          .forEach(function(voice) {
            AUTOGENERATED_AUDIO_LANGUAGES.forEach(function(audioLanguage) {
              if (voice.lang === audioLanguage.speech_synthesis_code ||
                (_isMobileDevice() &&
                voice.lang === audioLanguage.speech_synthesis_code_mobile)) {
                supportLang = true;
              }
            });
          });
      }
      return supportLang;
    };

    var _isMobileDevice = function() {
      var userAgent = navigator.userAgent || navigator.vendor || window.opera;
      return userAgent.match(/iPhone/i) || userAgent.match(/Android/i);
    };

    return {
      supportsSpeechSynthesis: function() {
        return _supportsSpeechSynthesis();
      },
      isMobileDevice: function() {
        return _isMobileDevice();
      }
    };
  }
]);
