/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input[name="amount"]',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
        min: 'data-min',
        max: 'data-max',
      },
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
  };

  class Product{
    constructor(id, data){
      this.id = id;
      this.data = data;
      this.renderInMenu();
      this.getElements();
      this.initAccordion();
      this.initOrderForm();
      this.initAmountWidget();
      this.processOrder();
      //console.log('new product:', this);
    }
    renderInMenu(){
      const generatedHTML = templates.menuProduct(this.data);
      //console.log(generatedHTML);
      this.element = utils.createDOMFromHTML(generatedHTML);
      const menuContainer = document.querySelector(select.containerOf.menu);
      menuContainer.appendChild(this.element);
    }
    getElements(){
      const thisProduct = this;
      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }
    initAccordion(){
      const thisProduct = this;
      /* find the clickable trigger (the element that should react to clicking) */
      //const accordion = thisProduct.element.querySelector(select.menuProduct.clickable);
      /* START: click event listener to trigger */
      thisProduct.accordionTrigger.addEventListener('click', function(){
        /* prevent default action for event */
        event.preventDefault();
        /* toggle active class on element of thisProduct */
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
        /* find all active products */
        const activeProducts = document.querySelectorAll(select.all.menuProductsActive);
        /* START LOOP: for each active product */
        activeProducts.forEach(product => {
          /* START: if the active product isn't the element of thisProduct */
          if(product!==thisProduct.element){
            /* remove class active for the active product */
            product.classList.remove(classNames.menuProduct.wrapperActive);
            /* END: if the active product isn't the element of thisProduct */
          }
          /* END LOOP: for each active product */
        });
        /* END: click event listener to trigger */
      });
    }
    initOrderForm(){
      const thisProduct = this;

      thisProduct.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
      thisProduct.formInputs.forEach(input => {
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      });
      thisProduct.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
      //console.log();
    }
    processOrder(){
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form);
      const productParams = thisProduct.data.params;
      let price = thisProduct.data.price;
      //const amountMax = thisProduct.data.amount.max;
      /*if(thisProduct.data.amount.min){
        thisProduct.amountWidgetElem.setAttribute('data-min', thisProduct.data.amount.min);
        console.log('min');
      }
      if(thisProduct.data.amount.max){
        thisProduct.amountWidgetElem.setAttribute('data-max', thisProduct.data.amount.max);
        console.log('nax');
      }*/
      for(let param in productParams){
        for(let option in productParams[param].options){
          const optionPrice = productParams[param].options[option].price;
          const isDefault = productParams[param].options[option].default;
          const images = thisProduct.imageWrapper.querySelectorAll('.' + param + '-' + option);
          if(formData.hasOwnProperty(param) && formData[param].includes(option)){
            if(!isDefault){
              price = price + optionPrice;
            }
            for(let image of images){
              image.classList.add(classNames.menuProduct.imageVisible);
            }
          }else{
            if(isDefault){
              price = price - optionPrice;
            }
            for(let image of images){
              image.classList.remove(classNames.menuProduct.imageVisible);
            }
          }
        }
      }
      price *= thisProduct.amountWidget.value;
      
      //thisProduct.amountWidgetElem.setAttribute('data-max', amountMax);
      // console.log(price);
      thisProduct.priceElem.innerHTML = price;
    }
    initAmountWidget(){
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function(){
        thisProduct.processOrder();
      });
    }
  }

  class AmountWidget{
    constructor(element){
      const thisWidget = this;
      thisWidget.getElements(element);
      thisWidget.initActions();
      thisWidget.setMinMax();
      thisWidget.value = thisWidget.min;
      thisWidget.setValue(thisWidget.input.value);
    }
    getElements(element){
      const thisWidget = this;
      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
      thisWidget.min = thisWidget.element.getAttribute(select.widgets.amount.min);
      thisWidget.max = thisWidget.element.getAttribute(select.widgets.amount.max);
    }
    setMinMax(){
      const thisWidget = this;
      const minAmount = parseInt(thisWidget.min);
      const maxAmount = parseInt(thisWidget.max);
      isNaN(minAmount) ? thisWidget.min = settings.amountWidget.defaultMin : thisWidget.min = minAmount;
      isNaN(maxAmount) ? thisWidget.max = settings.amountWidget.defaultMax : thisWidget.max = maxAmount;
    }
    setValue(value){
      const thisWidget = this;
      const newValue = parseInt(value);
      if(newValue!=thisWidget.value && newValue >= thisWidget.min && newValue <= thisWidget.max){
        thisWidget.value = newValue;
        thisWidget.announce();
      }
      thisWidget.input.value = thisWidget.value;
    }
    initActions(){
      const thisWidget = this;
      thisWidget.input.addEventListener('change', function(){
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click', function(){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });
      thisWidget.linkIncrease.addEventListener('click', function(){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }
    announce(){
      const thisWidget = this;
      const event = new Event('updated');
      thisWidget.element.dispatchEvent(event);
    }
  }

  const app = {
    initMenu: function(){
      //console.log('thisApp.data:', this.data);
      for(let productData in this.data.products){
        new Product(productData, this.data.products[productData]);
      }
    },
    initData: function(){
      this.data = dataSource;
    },
    init: function(){
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);
      thisApp.initData();
      thisApp.initMenu();
    },
  };
  
  app.init();
}
