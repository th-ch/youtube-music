/**
 * @noformat
 */

// Original variable names, taken from: https://www.npmjs.com/package/@webcomponents/custom-elements/v/1.1.2
// Code taken from: music.youtube.com

'use strict';

/*

 Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 Code distributed by Google as part of the polymer project is also
 subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
(() => {
  if (window.customElements) {
    const NativeHTMLElement = window.HTMLElement;

    const nativeDefine = window.customElements.define;
    const nativeGet = window.customElements.get;

    const tagnameByConstructor = new Map();
    const constructorByTagname = new Map();

    var browserConstruction = false;
    var userConstruction = false;

    window.HTMLElement = function () {
      if (!browserConstruction) {
        var tagName = tagnameByConstructor.get(this.constructor);
        tagName = nativeGet.call(window.customElements, tagName);
        userConstruction = true;
        return new tagName();
      }
      browserConstruction = false;
    };
    window.HTMLElement.prototype = NativeHTMLElement.prototype;
    window.HTMLElement.es5Shimmed = true;
    Object.defineProperty(window, "customElements", {
      value: window.customElements,
      configurable: true,
      writable: true
    });
    Object.defineProperty(window.customElements, "define", {
      value: (tagName, elementClass) => {
        if (tagName.startsWith("mdui-")) {
          browserConstruction = true;
          userConstruction = false;
          tagnameByConstructor.set(elementClass, tagName);
          constructorByTagname.set(tagName, elementClass);
          return nativeDefine.call(window.customElements, tagName, elementClass);
        }

        const elementProto = elementClass.prototype;
        const StandInElement = class extends NativeHTMLElement {
          constructor() {
            super();
            Object.setPrototypeOf(this, elementProto);
            if (!userConstruction) {
              browserConstruction = true;
              try {
                elementClass.call(this);
              } catch (p) {
                throw Error(`Constructing ${tagName}: ${p}`);
              }
            }
            userConstruction = false;
          }
        };
        const standInProto = StandInElement.prototype;
        StandInElement.observedAttributes = elementClass.observedAttributes;
        standInProto.connectedCallback = elementProto.connectedCallback;
        standInProto.disconnectedCallback = elementProto.disconnectedCallback;
        standInProto.attributeChangedCallback = elementProto.attributeChangedCallback;
        standInProto.adoptedCallback = elementProto.adoptedCallback;
        tagnameByConstructor.set(elementClass, tagName);
        constructorByTagname.set(tagName, elementClass);
        nativeDefine.call(window.customElements, tagName, StandInElement);
      },
      configurable: true,
      writable: true
    });
    Object.defineProperty(window.customElements, "get", {
      value: tagName => constructorByTagname.get(tagName),
      configurable: true,
      writable: true
    });
    if (navigator.userAgent.match(/Version\/(10\..*|11\.0\..*)Safari/)) {
      const a = HTMLElement.prototype.constructor;
      Object.defineProperty(HTMLElement.prototype, "constructor", {
        configurable: true,
        get() {
          return a;
        },
        set(b) {
          Object.defineProperty(this, "constructor", {
            value: b,
            configurable: true,
            writable: true
          });
        }
      });
    }
  }
})();
