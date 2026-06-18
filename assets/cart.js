class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('change', this.onVariantChange);
  }

  onVariantChange(event) {
    this.updateOptions();
    this.updateMasterId();
    this.updateSelectedSwatchValue(event);
    this.removeErrorMessage();
    this.updateVariantStatuses();

    if(!this.currentVariant) {
      this.toggleAddButton(true, '', true);
      this.setUnavailable();
    } else {
      //this.toggleAddButton(false, '', false);
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
      this.updateShareUrl();
    }
  }

  updateOptions(){
    this.options = Array.from(this.querySelectorAll('select, fieldset'), (element) => {
      if(element.tagName === 'SELECT') {
        return element.value;
      }
      if(element.tagName === 'FIELDSET') {
        return Array.from(element.querySelectorAll('input')).find((radio) => radio.checked)?.value;
      }
    });
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options.map((option, index) => {
          return this.options[index] === option;
      }).includes(false);
    });
  }

  updateSelectedSwatchValue({ target }) {
    const { name, value, tagName } = target;
    if(tagName === 'SELECT' && target.selectedOptions.length) {
      const selectedSwatchValue = this.querySelector(`[data-opt="${name}"]`);
      if(selectedSwatchValue) selectedSwatchValue.innerHTML = value;
    } else if(tagName === 'INPUT' && target.type === 'radio') {
      const selectedSwatchValue = this.querySelector(`[data-opt="${name}"]`);
      if(selectedSwatchValue) selectedSwatchValue.innerHTML = value;
    }
  }

  updateMedia(){
    if(!this.currentVariant) return;
    if(!this.currentVariant.featured_media) return;

    const mediaGalleries = document.querySelectorAll(`[id^="MediaGallery-${this.dataset.section}"]`);
     mediaGalleries.forEach((mediaGallery) => {
       var activeSl = mediaGallery.querySelector('.primgSlider .swiper-slide-active'),
         crmedia = 0;
       if(activeSl) crmedia = activeSl.dataset.id;
       if(crmedia != `${this.currentVariant.featured_media.id}` || Shopify.designMode){
          mediaGallery.setActiveMedia(`${this.currentVariant.featured_media.id}`, true);
       }
     });
  }

  updateURL(){
    if(!this.currentVariant || this.dataset.updateUrl === 'false') return;
    window.history.replaceState({}, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateShareUrl(){
    const shareButton = document.getElementById(`Share-${this.dataset.section}`);
    if(!shareButton || !shareButton.updateUrl) return;
    shareButton.updateUrl(`${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateVariantInput(){
    const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`);
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const BackInStock = document.querySelector(`#backInStock-${this.dataset.section}`);
    if(BackInStock) BackInStock.checkBackinstock(this.currentVariant);
  }

  updateVariantStatuses() {
    const selectedOptionOneVariants = this.variantData.filter(
      (variant) => this.querySelector(':checked').value === variant.option1
    );
    const inputWrappers = [...this.querySelectorAll('.product-form__input')];
    inputWrappers.forEach((option, index) => {
      if(index === 0) return;
      const optionInputs = [...option.querySelectorAll('input[type="radio"], option')];
      const previousOptionSelected = inputWrappers[index - 1].querySelector(':checked').value;
      const availableOptionInputsValue = selectedOptionOneVariants.filter((variant) => variant.available && variant[`option${index}`] === previousOptionSelected).map((variantOption) => variantOption[`option${index + 1}`]);
      this.setInputAvailability(optionInputs, availableOptionInputsValue);
    });
  }

  setInputAvailability(elementList, availableValuesList) {
    elementList.forEach((element) => {
      const value = element.getAttribute('value');
      const availableElement = availableValuesList.includes(value);

      if(element.tagName === 'INPUT') {
        element.classList.toggle('disabled', !availableElement);
      } else if(element.tagName === 'OPTION') {
        element.classList.toggle('disabled', !availableElement);
      }
    });
  }

  removeErrorMessage() {
    const section = this.closest('section');
    if(!section) return;
    const productForm = section.querySelector('product-form');
    if(productForm) productForm.handleErrorMessage();
  }

  renderProductInfo(){
    const requestedVariantId = this.currentVariant.id;
    const sectionId = this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section;

    document.querySelectorAll("#stickyOptions option").forEach((option) => {
      if(option.value === this.currentVariant.title) option.selected = true;
    });
    
    fetch(`${this.dataset.url}?variant=${requestedVariantId}&section_id=${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`)
      .then((response) => response.text()).then((responseText) => {
        // prevent unnecessary ui changes from abandoned selections
        if(this.currentVariant.id !== requestedVariantId) return;

        const html = new DOMParser().parseFromString(responseText, 'text/html');
        const destination = document.getElementById(`price-${this.dataset.section}`);
        const source = html.getElementById(`price-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        const skuSource = html.getElementById(`Sku-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        const skuDestination = document.getElementById(`Sku-${this.dataset.section}`);
        const inventorySource = html.getElementById(`Inventory-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        const inventoryDestination = document.getElementById(`Inventory-${this.dataset.section}`);
        const volumePricingSource = html.getElementById(`Volume-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        const pricePerItemDestination = document.getElementById(`Price-Per-Item-${this.dataset.section}`);
        const pricePerItemSource = html.getElementById(`Price-Per-Item-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        const volumePricingDestination = document.getElementById(`Volume-${this.dataset.section}`);
        const qtyRules = document.getElementById(`Quantity-Rules-${this.dataset.section}`);
        const volumeNote = document.getElementById(`Volume-Note-${this.dataset.section}`),
          stickyData = document.querySelector('sticky-cart .stickyData'),
          stickyDataSource = html.querySelector('sticky-cart .stickyData');

        if(volumeNote) volumeNote.classList.remove('hidden');
        if(volumePricingDestination) volumePricingDestination.classList.remove('hidden');
        if(qtyRules) qtyRules.classList.remove('hidden');

        if(source && destination) destination.innerHTML = source.innerHTML;
        if(inventorySource && inventoryDestination) inventoryDestination.innerHTML = inventorySource.innerHTML;
        if(skuSource && skuDestination) {
          skuDestination.innerHTML = skuSource.innerHTML;
          skuDestination.classList.toggle('hidden', skuSource.classList.contains('hidden'));
        }

        if(volumePricingSource && volumePricingDestination) {
          volumePricingDestination.innerHTML = volumePricingSource.innerHTML;
        }

        if(pricePerItemSource && pricePerItemDestination) {
          pricePerItemDestination.innerHTML = pricePerItemSource.innerHTML;
          pricePerItemDestination.classList.toggle('hidden', pricePerItemSource.classList.contains('hidden'));
        }

        const price = document.getElementById(`price-${this.dataset.section}`);
        if(price) price.classList.remove('hidden');

        if(inventoryDestination) inventoryDestination.classList.toggle('hidden', inventorySource.innerText === '');

        if(stickyData && stickyDataSource) stickyData.innerHTML = stickyDataSource.innerHTML;

        const addButtonUpdated = html.getElementById(`ProductSubmitButton-${sectionId}`);
        this.toggleAddButton(addButtonUpdated ? addButtonUpdated.hasAttribute('disabled') : true, window.variantStrings.soldOut);

        if(theme.mlcurrency) currenciesChange(document.querySelectorAll('product-info span.money, .stPrice span.money'));
        
        publish(PUB_SUB_EVENTS.variantChange, {
          data: { sectionId, html, variant: this.currentVariant, },
        });
      });
  }

  toggleAddButton(disable = false, text, modifyClass = true) {
    const productForm = document.getElementById(`product-form-${this.dataset.section}`);
    if(!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');
    if(!addButton) return;

    if(disable){
      addButton.setAttribute('disabled', 'disabled');
      if(text) addButtonText.textContent = text;
    } else {
      addButton.removeAttribute('disabled');
      var vr = `data-v${this.currentVariant.id}`,
        qty = document.querySelector('.prvQty').getAttribute(vr);
      if(qty < 1 && this.currentVariant.inventory_management == "shopify"){
        addButtonText.textContent = window.variantStrings.preOrder;
      } else{
        addButtonText.textContent = window.variantStrings.addToCart;
      }
    }
    if(!modifyClass) return;
  }

  setUnavailable() {
    const button = document.getElementById(`product-form-${this.dataset.section}`);
    const addButton = button.querySelector('[name="add"]');
    const addButtonText = button.querySelector('[name="add"] > span');
    const price = document.getElementById(`price-${this.dataset.section}`);
    const inventory = document.getElementById(`Inventory-${this.dataset.section}`);
    const sku = document.getElementById(`Sku-${this.dataset.section}`);
    const pricePerItem = document.getElementById(`Price-Per-Item-${this.dataset.section}`);
    const volumeNote = document.getElementById(`Volume-Note-${this.dataset.section}`);
    const volumeTable = document.getElementById(`Volume-${this.dataset.section}`);
    const qtyRules = document.getElementById(`Quantity-Rules-${this.dataset.section}`);

    if(!addButton) return;
    addButtonText.textContent = window.variantStrings.unavailable;
    if(price) price.classList.add('hidden');
    if(inventory) inventory.classList.add('hidden');
    if(sku) sku.classList.add('hidden');
    if(pricePerItem) pricePerItem.classList.add('hidden');
    if(volumeNote) volumeNote.classList.add('hidden');
    if(volumeTable) volumeTable.classList.add('hidden');
    if(qtyRules) qtyRules.classList.add('hidden');
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}
customElements.define('variant-selects', VariantSelects);

if(!customElements.get('product-info')) {
  customElements.define('product-info', class ProductInfo extends HTMLElement {
      constructor() {
        super();
        this.input = this.querySelector('.quantity__input');
        this.currentVariant = this.querySelector('.product-variant-id');
        this.submitButton = this.querySelector('[type="submit"]');
      }

      cartUpdateUnsubscriber = undefined;
      variantChangeUnsubscriber = undefined;

      connectedCallback() {
        if(!this.input) return;
        this.quantityForm = this.querySelector('.product-form__quantity');
        if(!this.quantityForm) return;
        this.setQuantityBoundries();
        if(!this.dataset.originalSection) {
          this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, this.fetchQuantityRules.bind(this));
        }
        this.variantChangeUnsubscriber = subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
          const sectionId = this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section;
          if(event.data.sectionId !== sectionId) return;
          this.updateQuantityRules(event.data.sectionId, event.data.html);
          this.setQuantityBoundries();
        });
      }

      disconnectedCallback() {
        if(this.cartUpdateUnsubscriber) {
          this.cartUpdateUnsubscriber();
        }
        if(this.variantChangeUnsubscriber) {
          this.variantChangeUnsubscriber();
        }
      }

      setQuantityBoundries() {
        const data = {
          cartQuantity: this.input.dataset.cartQuantity ? parseInt(this.input.dataset.cartQuantity) : 0,
          min: this.input.dataset.min ? parseInt(this.input.dataset.min) : 1,
          max: this.input.dataset.max ? parseInt(this.input.dataset.max) : null,
          step: this.input.step ? parseInt(this.input.step) : 1,
        };

        let min = data.min;
        const max = data.max === null ? data.max : data.max - data.cartQuantity;
        if(max !== null) min = Math.min(min, max);
        if(data.cartQuantity >= data.min) min = Math.min(min, data.step);

        this.input.min = min;
        this.input.max = max;
        this.input.value = min;
        publish(PUB_SUB_EVENTS.quantityUpdate, undefined);
      }

      fetchQuantityRules() {
        if(!this.currentVariant || !this.currentVariant.value) return;
        this.querySelector('.quantity__rules-cart .loading__spinner').classList.remove('hidden');
        fetch(`${this.dataset.url}?variant=${this.currentVariant.value}&section_id=${this.dataset.section}`)
          .then((response) => {
            return response.text();
          })
          .then((responseText) => {
            const html = new DOMParser().parseFromString(responseText, 'text/html');
            this.updateQuantityRules(this.dataset.section, html);
            this.setQuantityBoundries();
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.querySelector('.quantity__rules-cart .loading__spinner').classList.add('hidden');
          });
      }

      updateQuantityRules(sectionId, html) {
        const quantityFormUpdated = html.getElementById(`Quantity-Form-${sectionId}`);
        const selectors = ['.quantity__input', '.quantity__rules', '.quantity__label'];
        for (let selector of selectors) {
          const current = this.quantityForm.querySelector(selector);
          const updated = quantityFormUpdated.querySelector(selector);
          if(!current || !updated) continue;
          if(selector === '.quantity__input') {
            const attributes = ['data-cart-quantity', 'data-min', 'data-max', 'step'];
            for (let attribute of attributes) {
              const valueUpdated = updated.getAttribute(attribute);
              if(valueUpdated !== null) current.setAttribute(attribute, valueUpdated);
            }
          } else {
            current.innerHTML = updated.innerHTML;
          }
        }
      }
    }
  );
}

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true });
    this.input.addEventListener('change', this.onInputChange.bind(this));
    this.querySelectorAll('button').forEach((button) =>
      button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

  quantityUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.validateQtyRules();
    this.quantityUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.quantityUpdate, this.validateQtyRules.bind(this));
  }

  disconnectedCallback() {
    if(this.quantityUpdateUnsubscriber) {
      this.quantityUpdateUnsubscriber();
    }
  }

  onInputChange(event) {
    this.validateQtyRules();
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;
      
    event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
    if(previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
  }

  validateQtyRules() {
    const value = parseInt(this.input.value);
    if(this.input.min) {
      const min = parseInt(this.input.min);
      const buttonMinus = this.querySelector(".qtyBtn[name='minus']");
      buttonMinus.classList.toggle('disabled', value <= min);
    }
    if(this.input.max) {
      const max = parseInt(this.input.max);
      const buttonPlus = this.querySelector(".qtyBtn[name='plus']");
      buttonPlus.classList.toggle('disabled', value >= max);
    }
  }
}
customElements.define('quantity-input', QuantityInput);

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function removeTrapFocus(elementToFocus = null){
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener('focusout', trapFocusHandlers.focusout);
  document.removeEventListener('keydown', trapFocusHandlers.keydown);

  if(elementToFocus) elementToFocus.focus();
}

const trapFocusHandlers = {};
function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (e) => {
    if(e.target !== container && e.target !== last && e.target !== first) return;
    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function() {
    document.removeEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function(e) {
    if(e.code.toUpperCase() !== 'TAB') return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if(e.target === last && !e.shiftKey) {
      e.preventDefault();
      first.focus();
    }
    //  On the first focusable element and tab backward, focus the last element.
    if((e.target === container || e.target === first) && e.shiftKey){
      e.preventDefault();
      last.focus();
    }
  };
  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);
  elementToFocus.focus();
}

class CartRemoveButton extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', (e) => {
      e.preventDefault();
      const cartItems = this.closest('cart-items') || this.closest('cart-drawer-items');
      cartItems.updateQuantity(this.dataset.index, 0);
    });
  }
}
customElements.define('cart-remove-button', CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();
    this.lineItemStatusElement = document.getElementById('shopping-cart-line-item-status') || document.getElementById('CartDrawer-LineItemStatus');

    const debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, 300);
    this.addEventListener('change', debouncedOnChange.bind(this));
  }
  
  cartUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
      if(event.source === 'cart-items') {
        return;
      }
      this.onCartUpdate();
    });
  }

  disconnectedCallback() {
    if(this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  onChange(event) {
    this.updateQuantity(event.target.dataset.index, event.target.value, document.activeElement.getAttribute('name'), event.target.dataset.quantityVariantId);
  }
  onCartUpdate() {
    if(this.tagName === 'CART-DRAWER-ITEMS') {
      fetch(`${routes.cart_url}?section_id=cart-drawer`)
        .then((response) => response.text()).then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const selectors = ['cart-drawer-items', '.cart-drawer__footer'];
          for(const selector of selectors){
            const targetElement = document.querySelector(selector);
            const sourceElement = html.querySelector(selector);
            if(targetElement && sourceElement) {
              targetElement.replaceWith(sourceElement);
            }
          }
        })
        .catch((e) => {
          console.error(e);
        });
    } else {
      fetch(`${routes.cart_url}?section_id=main-cart`)
        .then((response) => response.text()).then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const sourceQty = html.querySelector('cart-items');
          this.innerHTML = sourceQty.innerHTML;
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }

  getSectionsToRender(){
    return [
      {
        id: 'main-cart-items',
        section: document.getElementById('main-cart-items').dataset.id,
        selector: '.js-contents',
      },
      {
        id: 'cartPage',
        section: document.getElementById('main-cart-items').dataset.id,
        selector: '.gift-wraper',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section'
      },
      {
        id: 'main-cart-footer',
        section: document.getElementById('main-cart-footer').dataset.id,
        selector: '.cartTotal',
      }
    ];
  }

  updateQuantity(line, quantity, name, variantId) {
    this.enableLoading(line);

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname,
    });

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);
        const quantityElement =
          document.getElementById(`Quantity-${line}`) || document.getElementById(`Drawer-quantity-${line}`);
        const items = document.querySelectorAll('.cart-item');

        if(parsedState.errors) {
          quantityElement.value = quantityElement.getAttribute('value');
          this.updateLiveRegions(line, parsedState.errors);
          return;
        }

        this.classList.toggle('is-empty', parsedState.item_count === 0);
        const cartDrawerWrapper = document.querySelector('cart-drawer');
        const cartFooter = document.getElementById('main-cart-footer');

        if(cartFooter) cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);
        if(cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', parsedState.item_count === 0);

        this.getSectionsToRender().forEach((section) => {
          const elementToReplace =
            document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
          elementToReplace.innerHTML = this.getSectionInnerHTML(
            parsedState.sections[section.section],
            section.selector
          );
        });
        const updatedValue = parsedState.items[line - 1] ? parsedState.items[line - 1].quantity : undefined;
        let message = '';
        if(items.length === parsedState.items.length && updatedValue !== parseInt(quantityElement.value)) {
          if(typeof updatedValue === 'undefined') {
            message = window.cartStrings.error;
          } else {
            message = window.cartStrings.quantityError.replace('[quantity]', updatedValue);
          }
        }
        this.updateLiveRegions(line, message);

        const lineItem =
          document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`);
        if(lineItem && lineItem.querySelector(`[name="${name}"]`)) {
          cartDrawerWrapper
            ? trapFocus(cartDrawerWrapper, lineItem.querySelector(`[name="${name}"]`))
            : lineItem.querySelector(`[name="${name}"]`).focus();
        } else if(parsedState.item_count === 0 && cartDrawerWrapper) {
          trapFocus(cartDrawerWrapper.querySelector('.drawer__inner-empty'), cartDrawerWrapper.querySelector('a'));
        } else if(document.querySelector('.cart-item') && cartDrawerWrapper) {
          trapFocus(cartDrawerWrapper, document.querySelector('.cart-item__name'));
        }

        publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-items', cartData: parsedState, variantId: variantId });
      })
      .catch(() => {
        this.querySelectorAll('.loading__spinner').forEach((overlay) => overlay.classList.add('hidden'));
        const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
        errors.textContent = window.cartStrings.error;
      })
      .finally(() => {
        this.disableLoading(line);
      });
  }
  updateLiveRegions(line, message) {
    const lineItemError = document.getElementById(`Line-item-error-${line}`) || document.getElementById(`CartDrawer-LineItemError-${line}`);
    if(lineItemError) lineItemError.querySelector('.ctItem-error').innerHTML = message;

    this.lineItemStatusElement.setAttribute('aria-hidden', true);

    const cartStatus = document.getElementById('cart-live-region-text') || document.getElementById('CartDrawer-LiveRegionText');
    cartStatus.setAttribute('aria-hidden', false);
    freeShippMsg();cartTerms();
    if(theme.mlcurrency) currenciesChange(document.querySelectorAll('cart-item span.money'));
    setTimeout(() => {
      cartStatus.setAttribute('aria-hidden', true);
    }, 1000);
  }
  getSectionInnerHTML(html, selector) {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  enableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    mainCartItems.classList.add('cart__items--disabled');

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) => overlay.classList.remove('hidden'));

    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute('aria-hidden', false);
  }
  disableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    mainCartItems.classList.remove('cart__items--disabled');

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

    cartItemElements.forEach((overlay) => overlay.classList.add('hidden'));
    cartDrawerItemElements.forEach((overlay) => overlay.classList.add('hidden'));
  }
}
customElements.define('cart-items', CartItems);

if(!customElements.get('cart-note')) {
  customElements.define('cart-note', class CartNote extends HTMLElement {
      constructor() {
        super();
        this.addEventListener('input',debounce((event) => {
            const body = JSON.stringify({ note: event.target.value });
            fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } });
          }, 300)
        );
      }
    }
  );
}

class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
    this.setHeaderCartIconAccessibility();
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector('#cartLink');
    cartLink.setAttribute('role', 'button');
    cartLink.setAttribute('aria-haspopup', 'dialog');
    cartLink.addEventListener('click', (e) => {
      e.preventDefault();
      const iscart = document.body.classList.contains('template-cart');
      if(!iscart) this.open(cartLink)
    });
    cartLink.addEventListener('keydown', (e) => {
      if(e.code.toUpperCase() === 'SPACE') {
        e.preventDefault();
        this.open(cartLink);
      }
    });
  }

  open(triggeredBy) {
    if(triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if(cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    setTimeout(() => {this.classList.add('animate', 'active')});

    this.addEventListener('transitionend', () => {
      const containerToTrapFocusOn = this.classList.contains('is-empty') ? this.querySelector('.drawer-empty') : document.getElementById('CartDrawer');
      const focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
      trapFocus(containerToTrapFocusOn, focusElement);
    }, { once: true });

    const isDrawer = document.getElementById('main-cart-items');
    if(!isDrawer) html.classList.add('of_hidden');
  }

  close() {
    this.classList.remove('active','poptop');
    removeTrapFocus(this.activeElement);
    html.classList.remove('of_hidden');
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute('role', 'button');
    cartDrawerNote.setAttribute('aria-expanded', 'false');

    if(cartDrawerNote.nextElementSibling.getAttribute('id')) {
      cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener('click', (e) => {
      e.currentTarget.setAttribute('aria-expanded', !e.currentTarget.closest('details').hasAttribute('open'));
    });

    //cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
  }

  renderContents(parsedState) {
    this.querySelector('.drawer__inner').classList.contains('is-empty') && this.querySelector('.drawer__inner').classList.remove('is-empty');
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section => {
      const sectionElement = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
      sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
    }));

    setTimeout(() => {
      this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
      this.open();
      if(theme.mlcurrency) currenciesChange(document.querySelectorAll('cart-item span.money'));
    });
  }
  getSectionInnerHTML(html, selector = '.shopify-section'){
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }
  getSectionsToRender() {
    return [
      {
        id: 'cart-drawer',
        selector: '#CartDrawer'
      },
      {
        id: 'cart-icon-bubble'
      }
    ];
  }
  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
  }
  setActiveElement(element) {
    this.activeElement = element;
  }
}
customElements.define('cart-drawer', CartDrawer);

class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return [
      {
        id: 'CartDrawer',
        section: 'cart-drawer',
        selector: '.drawer__inner'
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section'
      }
    ];
  }
}
customElements.define('cart-drawer-items', CartDrawerItems);

class CartDiscount extends HTMLElement {
  #activeFetch = null;
  constructor() {
    super();
    const form = this.querySelector("form");
    form.addEventListener("submit", this.applyDiscount);

    this.addEventListener("click", (event) => {
      if (event.target.closest(".cart-discount-remove")) {
        this.removeDiscount(event);
      }
    });
    this.submitButton = this.querySelector('[type="submit"]');
    this.errorEl = document.querySelector('.cart-discount__error') || document.querySelector('CartDrawer-discount__error');
  }

  #createAbortController() {
    if(this.#activeFetch) this.#activeFetch.abort();

    const abortController = new AbortController();
    this.#activeFetch = abortController;
    return abortController;
  }

  async #updateCartDiscount(discountCodes, abortController) {
    const body = JSON.stringify({discount: discountCodes.join(","), sections: this.getSectionsToRender().map((section) => section.section), sections_url: window.routes.cart_url,});
    const response = await fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body: body, signal: abortController.signal } });
    return response.json();
  }

  #updateCartUI(data){
    // Update main cart sections
    this.getSectionsToRender().forEach((section) => {
      if (data.sections && data.sections[section.section]){
        const elementToReplace = document.getElementById(section.id) ?.querySelector(section.selector) || document.getElementById(section.id);
        if(elementToReplace){
          elementToReplace.innerHTML = this.getSectionInnerHTML(data.sections[section.section], section.selector);
        }
      }
    });
  }

  #setLoadingState(isLoading) {
    if (isLoading) {
      this.submitButton.setAttribute("aria-disabled", "true");
      this.submitButton.classList.add("loading");
      this.submitButton.querySelector('.loading__spinner').classList.remove("hidden");
    } else {
      this.submitButton.removeAttribute("aria-disabled");
      this.submitButton.classList.remove("loading");
      this.submitButton.querySelector('.loading__spinner').classList.add("hidden");
    }
  }

  /*** Returns an array of existing discount codes. * @returns {string[]} */
  #existingDiscounts() {
    const discountCodes = [];
    const discountPills = this.querySelectorAll(".discount-code, [data-discount-code]");

    for (const pill of discountPills){
      if (pill instanceof HTMLElement){
        const code = pill.dataset.discountCode || pill.dataset.code;
        if (typeof code === "string" && code.trim()) {
          discountCodes.push(code.trim());
        }
      }
    }
    return discountCodes;
  }
  applyDiscount = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    this.errorEl.classList.add('hidden');
    
    const form = event.target instanceof HTMLFormElement ? event.target : this.querySelector("form");
    const discountCode = form.querySelector('input[name="discount"]');
    const discountCodeValue = discountCode.value.trim();
    if(!discountCodeValue) return;

    // Check if discount already exists
    const existingDiscounts = this.#existingDiscounts();
    if (existingDiscounts.includes(discountCodeValue)){
      this.#handleDiscountError('exist');
      return;
    }

    this.#setLoadingState(true);
    const abortController = this.#createAbortController();

    try {
      const updatedDiscounts = [...existingDiscounts, discountCodeValue];
      const data = await this.#updateCartDiscount(updatedDiscounts, abortController);

      /** @type {{ code: string; applicable: boolean; }} */
      if(data.discount_codes.find((discount) => { return (discount.code === discountCodeValue && discount.applicable === false);})){
        this.#handleDiscountError('discount');
        return;
      }

      discountCode.value = "";
      this.#updateCartUI(data);
      //this.#checkShipCode(discountCodeValue,data.discount_codes);
    } catch (error) {
      var type = "applying discount"
      this.#handleDiscountError(type);
    } finally {
      this.#setLoadingState(false);
      this.#activeFetch = null;
    }
  };

  removeDiscount = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const removeButton = event.target.closest(".cart-discount-remove");
    removeButton.setAttribute("aria-disabled", "true");
    removeButton.classList.add("loading");
    if(event instanceof KeyboardEvent && event.key !== "Enter") return;

    const discountCode = this.#getDiscountCodeFromEvent(event);
    if(!discountCode) return;

    const existingDiscounts = this.#existingDiscounts();
    const updatedDiscounts = existingDiscounts.filter((code) => code !== discountCode);

    if(updatedDiscounts.length === existingDiscounts.length){
      console.warn("Discount code not found in existing discounts");
      return;
    }

    const abortController = this.#createAbortController();

    try {
      const data = await this.#updateCartDiscount(updatedDiscounts, abortController);
      this.#updateCartUI(data);
    } catch (error) {

    } finally {
      this.#activeFetch = null;
      removeButton.setAttribute("aria-disabled", "false");
      removeButton.classList.remove("loading");
      this.errorEl.classList.add('hidden');
    }
  };

  #getDiscountCodeFromEvent(event) {
    const removeButton = event.target.closest(".discount-code");
    if (!removeButton) return null;
    return (removeButton.dataset.code || removeButton.dataset.discountCode || removeButton.closest("[data-discount-code]")?.dataset.discountCode || null);
  }

  #checkShipCode(code, codes){
    const existingDiscounts = this.#existingDiscounts();
    if(!existingDiscounts.includes(code) && codes.find((discount) => { return (discount.code === code && discount.applicable === true);})){
      this.#handleDiscountError('shipping');
    }
  }
  /*** Handles the discount error. */
  #handleDiscountError(type){
    if(type == 'shipping'){
      this.errorEl.textContent = cartStrings?.discount_ship;
    } else if(type == 'exist'){
      this.errorEl.textContent = cartStrings?.discount_already;
    } else {
      this.errorEl.textContent = cartStrings?.discount_error;
    }
    this.errorEl.classList.remove('hidden');
  }

  getSectionsToRender(){
    const mainCartItems = document.getElementById("main-cart-items");
    if(mainCartItems){
        return [
          {
            id: 'main-cart-items',
            section: document.getElementById('main-cart-items').dataset.id,
            selector: '.js-contents',
          },
          {
            id: 'cart-icon-bubble',
            section: 'cart-icon-bubble',
            selector: '.shopify-section'
          },
          {
            id: 'main-cart-footer',
            section: document.getElementById('main-cart-footer').dataset.id,
            selector: '.cartTotal',
          },
          {
            id: 'cartDiscount',
            section: document.getElementById('cartDiscount').dataset.id,
            selector: '.cart-discount__codes',
          }
        ];
    } else {
       return [
          {
            id: 'CartDrawer',
            section: document.getElementById('cartDiscount').dataset.id,
            selector: '.drawer__inner'
          },
          {
            id: 'cartDiscount',
            section: document.getElementById('cartDiscount').dataset.id,
            selector: '.cart-discount__codes',
          }
        ];
    }
  }

  getSectionInnerHTML(html, selector) {
    return ( new DOMParser().parseFromString(html, "text/html").querySelector(selector)?.innerHTML || "" );
  }
}

if (!customElements.get("cart-discount")){
  customElements.define("cart-discount", CartDiscount);
}

class CartOption extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll('.cftBtn').forEach((button) => button.addEventListener("click", function(e){
        e.preventDefault()
        const allElements = document.querySelectorAll('.cftDraw')
        allElements.forEach(el => el.classList.remove('active'))
        var ftbk = this.hash.substr(1);
        document.getElementById(ftbk).classList.add("active");
    }));

    document.querySelectorAll('.saveBtn').forEach((btn) => {
      btn.addEventListener('click',(e) => {
        e.preventDefault();
        [].forEach.call(document.querySelectorAll('.cftDraw'), function(dw){ dw.classList.remove("active"); });
      });
    });
  }
}
customElements.define('cart-option', CartOption);

function startTimer(duration, display) {
    var timer = duration, minutes, seconds;
    setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if(--timer < 0) {
            clearInterval(startTimer);
            document.querySelector('.cartCountdown').remove();
        }
    }, 1000);
}
window.onload = function(){
    if(document.querySelector('.cartCountdown')){
        var minutes = document.querySelector('.cartCountdown').getAttribute('data-countdown'),
            display = document.querySelector('#cartTime');
        startTimer(minutes, display);
    }
};

if(!customElements.get('product-form')) {
  customElements.define('product-form', class ProductForm extends HTMLElement {
      constructor() {
        super();
        this.form = this.querySelector('form');
        this.form.querySelector('[name=id]').disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');

        if(document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');

        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      onSubmitHandler(evt){
        evt.preventDefault();
        if(this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner').classList.remove('hidden');

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);
        if(this.cart) {
          formData.append('sections', this.cart.getSectionsToRender().map((section) => section.id));
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config).then((response) => response.json()).then((response) => {
            if(response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);

              const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
              if(!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButton.querySelector('span').classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if(!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            if(!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                cartData: response,
              });
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if(quickAddModal) {
              document.body.addEventListener('modalClosed',() => {
                  setTimeout(() => {
                    this.cart.renderContents(response);
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              this.cart.renderContents(response);
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove('loading');
            if(this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
            if(!this.error) this.submitButton.removeAttribute('aria-disabled');
            this.querySelector('.loading__spinner').classList.add('hidden');
            freeShippMsg();cartTerms();
          });
      }

      handleErrorMessage(errorMessage = false) {
        if(this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if(!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if(errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }
    }
  );
}

function cartTerms(){
  var cterms = document.querySelector('#cartTerms'),
    cBtn = document.querySelector('.cartCheckout');
  if(cterms && cBtn){
    cterms.onchange = function(){
      cBtn.disabled = !this.checked;
    }
  }
}
cartTerms();