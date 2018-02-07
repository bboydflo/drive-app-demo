'use strict';

// libs
import hasProp from 'hasprop';
import getProp from 'get-prop';

// lodash functions
import { map, trim, assign, filter, extend, isArray, template, cloneDeep, capitalize, isPlainObject } from 'lodash';

// module local vars
var log, menubar, cardTabs;

// exports
export default ($, axios, debug, DateFormat, Layout, Backbone, android, Menubar,
  Language, DbConnection, basecardTpl, Const, Row, CardModel, TabsModel, TableModel,
  InfoCardModel, ButtonModel, ButtonsCollection, TabsView, TableView, Toolbar, AlertModal,
  RemarksView, HistoryView, InfoCardView, BluetoothModal, EditView, ProcessEvent,
  onInputChange, LoginController, utils, session) => {

  // define table events hash
  let mixins = {
    // to catch "change" event on select input
    // useful to prevent event propagation
    'click .e-cell-input': onInputChange,
    'click select': onInputChange,

    // to catch "change" event on select input
    // read: https://stackoverflow.com/questions/785099/what-is-the-difference-between-onblur-and-onchange-attribute-in-html#785106
    'change select': onInputChange,
    // to catch "change" event on input
    'change .e-cell-input': onInputChange,
    // to catch "enter" event on input
    'keyup .e-cell-input': onInputChange,

    'click td': ProcessEvent,
    'contextmenu td': ProcessEvent,
    'hide td': ProcessEvent
  };

  // return basecard view
  return class V extends Layout {

    constructor(o) {
      super(assign({

        // no wrapping element
        el: false,

        // template function
        template: basecardTpl,

        // popup open
        popup: false,

        // events hash
        events: {

          // hide current tab
          'hide.bs.tab a[data-toggle="tab"] ': 'onHideTab'
        }
      }, o));
    }

    initialize() {

      // init log
      log = debug( 'BaseCardView' );

      // init menubar module
      menubar = menubar || Menubar();

      // listem for custom events
      $.subscribe( 'browse.basecard', this.onBrowse.bind(this) );
      $.subscribe( 'update-view.basecard', this.updateRow.bind(this) );
      $.subscribe( 'reader-result.basecard', this.onReaderResult.bind(this) );

      // labels
      var headT = session.get( 'sp_lang', 'SP_SowcardSowcard') || Language.sowcard.sowcard[this.lang];
      var entryT = session.get( 'sp_lang', 'SP_SowcardAnimal') || Language.sowcard.animal[this.lang];
      var remarksT = session.get( 'sp_lang', 'SP_CardRemarks') || Language.card.remarks[this.lang];
      var renamingT = session.get( 'sp_lang', 'SP_SowcardRenaming') || Language.sowcard.renaming[this.lang];
      var medicineT = session.get( 'sp_lang', 'SP_SowcardMedicine') || Language.sowcard.medicine[this.lang];
      var transferT = session.get( 'sp_lang', 'SP_SowcardTransfer') || Language.sowcard.transfer[this.lang];
      var conditionT = session.get( 'sp_lang', 'SP_SowcardCondition') || Language.sowcard.condition[this.lang];
      var taggingT = session.get( 'sp_lang', 'SP_SowcardTagging') || Language.sowcard.tagging[this.lang];
      var pigletTransT = session.get( 'sp_lang', 'SP_SowcardPigletTransfer') || Language.sowcard.pigletTransfer[this.lang];
      var deadPigletT = session.get( 'sp_lang', 'SP_SowcardDead') || Language.sowcard.dead[this.lang];
      var dnaSampleT = session.get( 'sp_lang', 'SP_SowcardDNASample') || Language.sowcard.dnaSample[this.lang];
      var skippedT = session.get( 'sp_lang', 'SP_SowcardSkipped') || Language.sowcard.skipped[this.lang];
      var exitT = session.get( 'sp_lang', 'SP_SowcardRemoval') || Language.sowcard.removal[this.lang];
      var suplementalT = session.get( 'sp_lang', 'SP_SowcardSuplemental') || Language.sowcard.suplemental[this.lang];
      var danbreedT = session.get( 'sp_lang', 'SP_SowcardDanbredtagging') || Language.sowcard.danbredtagging[this.lang];
      var keyfiguresT = session.get( 'sp_lang', 'SP_SowcardKeyfigures') || Language.sowcard.keyfigures[this.lang];

      // setup card tabs
      cardTabs = [
        {
          name: 'thead',
          icon: 'icon_sowcardMenuItem',
          title: headT
        },{
          name: 'entry',
          icon: 'icon_animalMenuItem',
          title: entryT,
          addRow: false
        }, {
          name: 'remark',
          icon: 'icon_sowRemarkMenuItem',
          title: remarksT,
          addRow: false
        }, {
          name: 'renaming',
          icon: 'icon_RenamingMenuItem',
          title: renamingT,
          addRow: false
        }, {
          name: 'medicine',
          icon: 'icon_medicineMenuItem',
          title: medicineT,
          addRow: true
        }, {
          name: 'transfer',
          icon: 'icon_sowTransferMenuItem',
          title: transferT,
          addRow: true
        }, {
          name: 'condition',
          icon: 'icon_conditionMenuItem',
          title: conditionT,
          addRow: true
        }, {
          name: 'tagging',
          icon: 'icon_taggingMenuItem',
          title: taggingT,
          addRow: false
        }, {
          name: 'piglettransfer',
          icon: 'icon_pigletTransferMenuItem',
          title: pigletTransT,
          addRow: true
        }, {
          name: 'deadpiglet',
          icon: 'icon_deadPigletMenuItem',
          title: deadPigletT,
          addRow: true
        }, {
          name: 'dnasample',
          icon: 'icon_dnaSampleMenuItem',
          title: dnaSampleT,
          addRow: true
        }, {
          name: 'skippedinbox',
          icon: 'icon_skippedInBoxMenuItem',
          title: skippedT,
          addRow: true
        }, {
          name: 'exit',
          icon: 'icon_removalMenuItem',
          title: exitT,
          addRow: false
        }, {
          name: 'suplemental',
          icon: 'icon_supplementalRegistrationMenuItem',
          title: suplementalT,
          addRow: true
        }, {
          name: 'danbredtagging',
          icon: 'icon_breedMenuItem',
          title: danbreedT,
        }
      ];

      // set table name
      this.tableName = Const.DB_TABLES[1].name;

      // if breedingcard update card tabs array
      if ( this.isBreedingCard() ) {

        // update table name
        this.tableName = Const.DB_TABLES[2].name;

        // remove head card
        cardTabs.shift();
      } else {

        // include keyfigures tab
        cardTabs.push({
          name: 'keyfigures',
          icon: 'icon_keyfiguresMenuItem',
          title: keyfiguresT,
        });
      }

      // listen for custom events
      this.on( 'back', this.onBack, this );
      this.on( 'edit-row', this.editRow, this );
      this.on( 'bluetooth', this.onBluetooth, this );
    }

    beforeRender() {
      var data   = this.model.get( 'data' ),
        layout   = this.model.get( 'layout' ),
        cardView = this.getView( '.card-view' ),
        tabsView = this.getView( '.tabs-view' );

      // resume early
      if ( cardView || tabsView ) return;

      // log
      log( layout );

      // create wmpty card model
      var cardModel = new InfoCardModel({ headers: data.headers });

      // create card view
      cardView = new InfoCardView({ model: cardModel, lang: this.lang });

      // set card view
      this.setView( '.card-view', cardView );

      // get existing tabs
      var existingTabs = this.getTabsList();

      // loop through possible sowcard layouts to get tabs properties
      var tabs = map( existingTabs, this.getTabProps.bind(this) );

      // create tabs model
      // var tabsModel = new TabsModel({ tabs: tabs });
      var tabsModel = new TabsModel({ tabs });

      // create tabs view
      tabsView = new TabsView({ model: tabsModel });

      // set tabs view
      this.setView( '.tabs-view', tabsView );

      // loop through each tab and build main views and toolbar views
      map(tabs, function(tab){
        var viewType, mainView, toolbarView,
          showToolbar = true;

        // log
        log( tab );

        // build main view
        mainView = this.buildTabMainView( tab, layout, data );

        // validate main view
        if ( !mainView ) return;

        // insert tab main-view
        tabsView.setView( '.tab-main-' + tab.name, mainView );

        // build toolbar
        toolbarView = this.buildTabToolbar( tab );

        // validate toolbar view
        if ( !toolbarView ) return;

        // check tab
        if ( tab.name == 'thead' ) {

          // get view type
          viewType = this.model.get( 'viewType' );

          // check view type
          if ( viewType ) {

            // update show-toolbar flag
            showToolbar = false;
          }
        }

        // insert tab main-view
        tabsView.setView( '.tab-extra-' + tab.name, toolbarView );

        // set toolbar visibility
        tabsView.setVisibility( 'tab-extra-' + tab.name, showToolbar );
      }.bind(this));

      // init android
      $.publish( 'init-android' );
    }

    afterRender() {

      // get active view name
      var activeView = this.model.get( 'activeView' );

      // check active view
      if ( !activeView ) return;

      // show tab
      this.activateTab( activeView );

      // apply tooltip plugin
      this.$( '.tooltip-target' ).tooltipster({
        multiple: true
      });

      // update reader mode
      this.updateMode( Const.SINGLE_MODE );
    }

    updateMode(readerMode) {

      // check if android
      if ( android && android.isInitialized() ) {

        // update reader mode
        android.updateMode( readerMode );
      }
    }

    // get connection
    getConnection() {

      // get connection
      return DbConnection
        .then(function(connection) {

          // resolve promise
          return connection;
        });
    }

    isBreedingCard() {
      return this.model.get( 'cardType' );
    }

    // need to implement this common function for the top views
    isDirty() {

      // resume
      return false;
    }

    togglePopup(popup) {

      // check popup state
      if ( typeof popup == 'undefined' ) {

        // update popup flag
        this.popup = !this.popup;
      } else {

        // get state from the upper component
        this.popup = popup;
      }
    }

    activateTab(tabId) {

      // select specific tab and apply bootstrap plugin (tab)
      this.$( '#' + tabId + '-tab' ).tab( 'show' );
    }

    // utility method to get tab properties
    getTabProps(tab, index) {
      var isActive = false;

      // get layout
      var layout = this.model.get( 'layout' );

      // get active view
      var activeView = session.get( 'card', layout.requestKey, 'active' );

      // validate active view
      if ( !activeView || activeView == tab.name ) {

        // update is active
        isActive = true;

        // update model
        this.model.set( 'activeView', tab.name );

        // update card state
        session.set( 'card', layout.requestKey, 'active', tab.name ).persist();
      }

      // resume
      return {
        name: tab.name,
        icon: tab.icon,
        title: tab.title,
        index: index,
        addRow: tab.addRow,
        active: isActive,
      };
    }

    /**
     * build main tab view
     */
    buildTabMainView(tab, layout, data) {
      var view,
        setDate   = true,
        dataSrc   = tab.name,
        viewType  = this.model.get( 'viewType' ),

        // new rows will be removable by default
        removable = 1;

      // remark
      if ( tab.name == 'remark' ) {

        // create remark view
        view = new RemarksView({ lang: this.lang });

        // listen for 'full-sowcard' event
        view.on( 'edit-remark', this.editRemark.bind(this) );

        // resume
        return view;
      }

      // thead
      if ( tab.name == 'thead' ) {

        // history view
        if ( viewType ) {

          // define view
          view = new HistoryView({
            model: this.model,
            lang: this.lang
          });

          // listen for 'full-sowcard' event
          view.on( 'show-fullsowcard', this.switchLittersView.bind(this) );

          // listen for 'full-sowcard' event
          view.on( 'request-sowcard', this.requestBaseCard.bind(this) );

          // resume
          return view;
        } else {

          // update data source
          dataSrc = 'litters';
        }
      }

      // set table edit (edit row on click anywhere on the table)
      var tEdit = tab.name == 'exit' ? true : false;

      // get rows
      var tRows = getProp( data, [dataSrc, 'tr'], [] );

      // define mode
      var model = new TableModel({
        tId: tab.name,
        tHead: layout[tab.name],
        tRows: tRows,
        tRemovable: removable,
        tDate: setDate,
        tEdit: tEdit
      });

      // define a new view attach handlers and return it
      view = new TableView({ model: model, lang: this.lang });

      // enable tooltips
      view.toggleTooltips();

      // attach custom events
      view.on( 'edit-table', EditView );
      view.on( 'edit-row', this.editRow, this );
      view.on( 'remove-row', this.onRemoveRow, this );
      view.on( 'positive', this.onPositive, this );
      view.on( 'negative', this.onNegative, this );

      // set extra events
      view.setEventHandlers( mixins );

      // resume
      return view;
    }

    /**
     * build tab toolbar view
     */
    buildTabToolbar(tab) {

      // test for 'entry, 'exit' or 'danbredtagging'
      if ( tab.name == 'entry' || tab.name == 'exit' || tab.name == 'danbredtagging' || tab.name == 'remark' || tab.name == 'keyfigures' ) {

        // skip creating toolbar components for these tabs
        return;
      }

      var buttons = [];

      // labels
      var vLittersT = session.get( 'sp_lang', 'SP_SowcardViewLitters') || Language.sowcard.viewLitters[this.lang];
      var addRowT = session.get( 'sp_lang', 'SP_ButtonAddRow') || Language.button.addRow[this.lang];

      // thead
      if ( tab.name == 'thead' ) {

        // create toolbar view
        buttons.push({
          class: 'btn-default',
          title: vLittersT,
          icon: 'glyphicon-th-list',
          visible: true,
          event: 'view-litters'
        });
      } else {

        // create toolbar view
        buttons.push({
          class: 'btn-primary',
          title: addRowT,
          icon: 'glyphicon-plus',
          visible: true,
          event: 'add-row'
        });
      }

      // define toolbar collection
      // var toolbarCollection = new ButtonsCollection({ model: ButtonModel });
      var toolbarCollection = new ButtonsCollection( buttons );

      // create toolbar view
      var toolbarView = new Toolbar({ collection: toolbarCollection });

      // listen for custom events
      toolbarView.on( 'add-row', this.onAddRow.bind(this) );
      toolbarView.on( 'view-litters', this.switchLittersView.bind(this) );

      // return toolbar view
      return toolbarView;
    }

    // get actual tabs list
    getTabsList() {
      var layout = this.model.get( 'layout' );

      // filter tabs
      return filter(cardTabs, function( tab ){

        // filter condition
        return hasProp( layout, [tab.name] ) || ( tab.name == 'remark' );
      });
    }

    // get active view
    getActiveView() {

      // return active view
      return this.getTabView( this.model.get('activeView') );
    }

    /**
     * get main/extra subview by name
     * @param  {string} name - name of the tab
     * @param  {boolean} bool - describes if it should return main or extra view
     * @return - returns view object or false if error
     */
    getTabView(name, bool) {
      var args   = Array.prototype.slice.call( arguments ),
        type     = 'main',
        tabsView = this.getView( '.tabs-view' );

      // check if enough arguments
      if ( !args.length ) return false;

      // validate name
      if ( !name || typeof name !== 'string' ) return false;

      // check if should return extra view
      if ( bool ) {

        // update type
        type = 'extra';
      }

      // return subview
      return tabsView.getView( '.tab-' + type + '-' + name );
    }

    isOnline() {

      // online/offline status
      return session.get( 'app', 'connection' ) == Const.NET_CONNECTED;
    }

    getOnlineCard(options) {

      // save context
      var _self = this;

      // define default method
      var method = '?';

      // check operation
      switch ( options.operation ) {
      case '>':
        method += '+,';
        break;
      case '<':
        method += '-,';
        break;
      }

      // check if reading uhfrid
      if ( options.key == 'uhfrfid' ) {
        method += 'U,';
      }

      // check if reading lfrfid
      if ( options.key == 'lfrfid' ) {
        method += 'l,';
      }

      // check card number
      var cardNo = options.value == 'last' ? '' : options.value;

      // init server address
      var server_address = session.get( 'device', Const.SERVER_URL ) || '/';

      // build make active
      var makeActive = options.makeActive || '';

      // define full request url
      var url = server_address +
        'get.html?' +
        session.get('layouts', 'sessionKey') +
        '?' + options.layout.requestKey +
        method +
        cardNo +
        makeActive;

      // axios post config
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      return axios
        .post(url, options.layout, config)
        .then(function(response) {
          try {

            // process response
            return _self.processResponse( options, response.data );
          } catch(e) {

            // dispatch error further
            throw e;
          }
        })
        .catch(function(err){

          // get error type
          var errType = getProp( err, ['type'], -1 );

          // check error type
          if ( errType < 0 ) {

            // throw custom error
            throw {
              type: 5,
              source: 'Server',
              message: 'No connection!',
              connectionState: Const.NET_SERVER_DOWN
            };
          }

          throw err;
        });
    }

    /**
     * helper method to get the last card index from the database
     * @return {promise} [description]
     */
    getLastCardIndex(requestKey) {

      // get table name
      var tableName = this.tableName;

      // get db connection
      return this
        .getConnection()
        .then(function(connection) {

          // use db connection
          return connection.countAll( tableName );
        })
        .then(function(result){

          // log
          log( result );

          // check type
          if ( typeof result !== 'number' || result < 1 ) {

            // reject promise and resume
            throw({
              type: 6,
              source: 'Database',
              message:  'Error counting items in: ' + tableName + '  for layout' + requestKey + ' @requestLastCard'
            });
          }

          // resolve promise
          return result - 1;
        });
    }

    getOfflineCard(query, options) {

      // save context
      var _self = this;

      // get db connection
      return this
        .getConnection()
        .then(function(connection) {

          // use db connection
          return connection.getRowsBy( _self.tableName, query );
        })
        .then(function(response){

          // returns a promise
          return _self.processResponse( options, response );
        });
    }

    // update card with new data
    renderData(cardData) {

      // log
      log( cardData );

      // update menubar with sowcard number
      menubar.updateModel({ value: cardData.number });

      // normalize sowcard
      cardData = this.normalizeCard( cardData );

      // update views
      return this.renderViews( cardData );
    }

    // update active tab helper
    updateActiveTab(cardData){

      // get active view name
      var activeView = this.model.get( 'activeView' );

      // check active view
      if ( activeView == 'danbredtagging' ) {

        // get list of tabs
        var tabsList = this.getTabsList();

        // loop through existing tabs
        for ( var i=0; i<tabsList.length; i++ ) {

          // get tab name
          var tName = tabsList[i].name;

          // check tab name
          if ( tName !== activeView ) {

            // reset assign tab
            this.model.set( 'assignTab', 0 );

            // jump to the new tab
            this.activateTab( tName );

            // break loop
            break;
          }
        }
      }

      // resume
      return cardData;
    }

    /**
     * fetch data both online and offline.
     * supports multiple query types
     * @param  {string} key - query key
     * @param  {string} operation - query operation
     * @param  {Object} value - query value
     * @param  {boolean} connection - connection state
     * @return {Promise}
     */
    fetchData(options) {
      var fetchPromise,
        method = '?',
        layout = getProp(options, ['layout'], this.model.get('layout') );

      // get value
      var value = options[ options.key ];

      // online mode
      if ( options.isOnline ) {

        // check operation
        switch ( options.operation ) {
        case '>':
          method += '+,';
          break;
        case '<':
          method += '-,';
          break;
        }

        // check if reading uhfrid
        if ( options.key == 'uhfrfid' ) {
          method += 'U,';
        }

        // check if reading lfrfid
        if ( options.key == 'lfrfid' ) {
          method += 'l,';
        }

        // init server address
        var server_address = session.get( 'device', Const.SERVER_URL ) || '/';

        // define full request url
        var url = server_address + 'get.html?' + session.get('layouts', 'sessionKey') + '?' + layout.requestKey + method + value;

        // post data
        var data = utils.getLayoutBy( 'requestKey', layout.requestKey );

        // axios post config
        var config = {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        };

        // define online fetch promise
        fetchPromise = axios
          .post(url, data, config)
          .then(function(response) {
            console.log(response);
            return response.data;
          })
          .catch(function(){
            // throw custom error
            throw {
              type: 5,
              source: 'Server',
              message: 'No connection!',
              connectionState: Const.NET_SERVER_DOWN
            };
          });
      } else {

        // get table name
        var tableName = this.tableName;

        // get db connection
        fetchPromise = this
          .getConnection()
          .then(function(connection) {

            // create query
            var query = { layout: layout.requestKey };

            // previous
            if ( options.operation == '<' ) {

              // update value
              value -= 1;
            }

            // next
            if ( options.operation == '>' ) {

              // update value
              value += 1;
            }

            // update query
            query[options.key] = value;

            // use db connection
            return connection.getRowsBy( tableName, query );
          });
      }

      // on fetch done
      return fetchPromise.then( this.processResponse.bind(this, options) );
    }

    processResponse(options, response) {
      var result, validResult;

      // check result
      switch ( typeof response ) {
      case 'string':

        // check result
        if ( !response ) {

          // throw custom error
          throw {
            type: 4,
            source: 'Server',
            message: 'No data available!'
          };
        }

        // create tags error
        // request not active breeding card
        if ( response[0] == '?' ) {

          // update error message
          response = response.substring( 1, response.length );

          // check response
          if ( response.indexOf('notactive') > -1 ) {

            // reject promise and resume
            throw {
              type: 8,
              source: 'Server',
              message: response
            };
          }

          // reject promise and resume
          throw {
            type: 7,
            source: 'Server',
            message: response
          };
        }

        // notfound
        // nouser
        // endofsows
        // other errors
        if ( response[0] == '!' ) {

          // update error message
          response = response.substring( 1, response.length );

          // reject promise and resume
          throw {
            type: 2,
            source: 'Server',
            message: response
          };
        }

        try {

          // parse the json string
          validResult = JSON.parse( response );
        } catch ( e ) {

          // log
          log( 'invalid json' );
          log( response );

          // toast
          // $.publish( 'toast', [2, Language.toast['6'][lang]] );

          // reject promise and resume
          throw {
            type: 4,
            source: 'Server',
            message: 'Invalid response: ' + response + '!',
            response: response
          };
        }

        // valid json object
        if ( !getProp( validResult, ['sowcards'], []).length ) {

          // reject promise and resume
          throw {
            type: 4,
            source: 'Server',
            message: 'No valid data available!'
          };
        }

        // update result
        result = validResult.sowcards[ 0 ];
        break;
      case 'object':

        // is object
        if ( isPlainObject(response) ) {

          // return sowcard
          return response.sowcards[0];
        }

        // validate reponse
        if ( !isArray(response) || !response.length ) {

          // reject promise and resume
          throw {
            type: 6,
            source: 'SmartPigs',
            message: '!endofsows'
          };
        }

        // update result
        result = response[ 0 ];
        break;
      }

      // resume
      return result;
    }

    // process fetch errors
    // { layout, key, index, number, operation, isOnline } = options;
    fetchFail(options, err) {
      var _self = this,
        lang  = this.lang;

      // log
      log( err );
      log( options );

      // check key
      var optVal = options[ options.key ];

      // get error details
      var errSrc  = getProp( err, ['source'], 'Database' );
      var errMsg  = getProp( err, ['message'], err.toString() );
      var errType = getProp( err, ['type'], 6 );

      // hide spinner
      $.publish( 'spinner', [false] );

      // labels
      var t1 = session.get( 'sp_lang', 'SP_ModalsBody13') || Language.modals.body13[lang];
      var t2 = session.get( 'sp_lang', 'SP_ModalsTitle8') || Language.modals.title8[lang];
      var t3 = session.get( 'sp_lang', 'SP_ButtonCancel') || Language.button.cancel[lang];
      var t4 = session.get( 'sp_lang', 'SP_ButtonOk') || Language.button.ok[lang];
      var t5 = session.get( 'sp_lang', 'SP_ModalsTitle9') || Language.modals.title9[this.lang];

      // check error type
      switch( errType ) {

      // server error
      case 2:

        // nouser
        if ( errMsg.indexOf('nouser') > -1 ) {

          // session expired
          return $.publish('session-expired', function() {

            // fetch data
            _self.fetchData( options );
          });
        }

        // notfound
        if ( errMsg.indexOf('notfound') > -1 ) {

          // breeding card
          if ( this.isBreedingCard() ) {

            // toast
            return $.publish( 'toast', [2, options.key.capitalizeFirstLetter() + ' ' + (options.value || optVal) + ' ' + t1] );
          }

          // if 'lfrfid' or 'uhfrfid'
          if ( (options.key == 'lfrfid' || options.key == 'uhfrfid') && options.operation == '=' ) {

            // toast and resume
            return $.publish( 'toast', [2, options.key.capitalizeFirstLetter() + ' ' + (options.value || optVal) + ' ' + t1] );
          }

          // create new sowcard dialog and resume
          return this.createNew( options );
        }

        // endofsows
        if ( errMsg.indexOf('endofsows') > -1 ) {

          // browsing to the end of sows
          if ( options.operation == '>' || options.operation == '<' ) {

            // toast and resume
            $.publish( 'toast', [2, t2] );

            // resume
            return;
          }

          // breeding card
          if ( this.isBreedingCard() ) {

            // toast
            $.publish( 'toast', [2, options.key.capitalizeFirstLetter() + ' ' + (options.value || optVal) + ' ' + t1] );
          }
        }

        // toast
        $.publish( 'toast', [2, errSrc + ' error: ' + errMsg + '!'] );
        break;

      // invalid response
      case 4:

        // toast
        $.publish( 'toast', [2, errSrc + ' error: ' + errMsg + '!'] );
        break;

      // no connection
      case 5:

        // toast
        $.publish( 'toast', [2, 'No connection!'] );
        break;

      // end of sows in offline mode
      case 6:

        // offline mode
        if ( !options.isOnline ) {

          // if breeding card
          if ( this.isBreedingCard() || options.operation !== '=' ) {

            // log
            log( options.key.capitalizeFirstLetter() + ' ' + (options.value || optVal) + ' ' + t5 );

            // toast
            return $.publish( 'toast', [2, t5] );
          }
        }

        // create new sowcard dialog and resume
        this.createNew( options );
        break;

      case 8:

        // not active
        if ( errMsg.indexOf('notactive') > -1 ) {

          // breeding card
          if ( this.isBreedingCard() ) {

            // err msg label
            var l1 = session.get( 'sp_lang', 'SP_ModalsTitle13') || Language.modals.title13[lang];

            // define correct messsage
            var cMsg = session.get( 'sp_lang', 'SP_ModalsTitle14') || Language.modals.title14[lang];

            // get msg out of error message
            var eMsg = errMsg.split(':');

            // remove first part of the message
            eMsg.shift();

            // check eMsg
            if ( eMsg.length == 2 ) {

              // update correct message
              cMsg = eMsg[0] + '(' + trim(eMsg[1]) + ')';
            }

            // show error dialog
            var alertModal = AlertModal({
              title: l1,
              //  title: l1 + '(' + options.key + ': ' + (options.value || optVal) + ')',
              message: cMsg,
              cancel: t3,
              confirm: t4,
              confirmVisible: true,
              cancelVisible: true
            });

            // listen for confirm event
            alertModal.on( 'hidden', _self.togglePopup, _self );
            alertModal.on( 'visible', _self.togglePopup, _self );
            alertModal.on('confirm', function(){

              // hide dialog
              this.hide(function(){

                // request card again
                _self.requestCard( '=', (options.value || optVal), '?makeActive', options.key );
              });
            });

            // render alert modal and resume
            return alertModal.render();
          }
        }
        break;

      // database errors
      default:

        // toast
        $.publish( 'toast', [2, 'Database error: ' + errMsg + '!'] );
        break;
      }
    }

    // normalize data
    normalizeCard(data) {

      // get existing tabs
      var tabs = this.getTabsList();

      // add support for 'createtags' data source
      tabs.push({ name: 'createtags' });

      // loop through each tab
      map( tabs, this.normalizeView.bind(null, data) );

      // resume
      return data;
    }

    // normalize single view data
    normalizeView(data, tab) {

      // get data source
      var dataSrc = tab.name == 'thead' ? 'litters' : tab.name;

      // get rows
      var rows = getProp( data, [dataSrc, 'tr'] );

      // check rows
      if ( !rows ) return;

      // loop through each tab rows
      rows = map( rows, TableView.prototype.normalizeRow );

      // update data
      data[dataSrc].tr = rows;
    }

    // render all subviews
    renderViews(data) {

      // get existing tabs
      var existingTabs = this.getTabsList();

      // update view model
      this.model.updateData( data );

      // update card view. triggers auto-refresh
      this.updateCardView( data );

      // update each existing tab
      var promises = map(existingTabs, function( tab ){

        // return a promise
        return this.renderTabView( data, tab );
      }.bind(this));

      // wait for all promises to finish
      return Promise.all( promises ).then(function(){

        // resume
        return data;
      }, function(err) {

        // log
        console.log( err );
      });
    }

    /**
     * update card view model. triggers auto-refresh
     * @param  {[type]} data [description]
     * @return {[type]}      [description]
     */
    updateCardView(data) {
      var cardView = this.getView( '.card-view' );

      // check card view
      if ( !cardView ) {

        // log
        log( cardView );

        // toast
        $.publish( 'toast', [2, 'Invalid card view @updateCardView!'] );

        // resume
        return false;
      }

      // log
      log( data );

      // update card view will force rendering card info view
      cardView.model.set({ headers: data.headers });
    }

    /**
     * will update a tab view model, render it and redelegate events
     * @param  {string} name - tab name
     * @param  {object} view - new view
     * @param  {boolean} bool - describes the type of the view to be updated (main/extra)
     * @return {boolean} - true on success, false on error
     */
    renderTabView(data, tab) {
      var dataSrc = tab.name,
        viewType  = this.model.get( 'viewType' );

      // get tab view
      var view = this.getTabView( tab.name );

      // returns a promise
      return new Promise(function(resolve, reject){

        // minimal validation
        if ( !view || !(view instanceof Layout) ) {

          // log
          log( view );

          // reject promise
          reject({
            type: 6,
            source: 'SmartPigs',
            message: 'Invalid view instance @renderTabView!'
          });

          // resume
          return;
        }

        // remark
        if ( tab.name == 'remark' ) {

          // update remark view
          view.updateRemark( data.remark );

          // render view and reattach table events
          return view
            .render()
            .promise()
            .done(resolve);
        }

        // check tab name
        if ( tab.name == 'thead' ) {

          // update data src
          dataSrc = 'litters';

          // history view
          if ( viewType ) {

            // reset defaults
            view.resetDefaults();

            // resolve promise
            resolve();

            // resume
            return;
          }
        }

        // log
        // console.log( 'data source = ' + dataSrc + ', tab name = ' + tab.name + ', tRows = ' + data[dataSrc].tr );

        // update view
        view.model.set({
          tRows: data[dataSrc].tr,
          tIndex: 0,
          bIndex: data[dataSrc].tr.length
        });

        // render view and reattach table events
        view
          .render()
          .promise()
          .done(resolve);
      });
    }

    // implement Tildel Avl feature
    tildelAvl(activeTab) {
      var taggingView;

      // get data
      var data   = this.model.get( 'data' );
      var layout = this.model.get( 'layout' );

      // get tabs view
      var tabsView = this.getView( '.tabs-view' );

      // if tagging data
      if ( data[activeTab].tr.length ) {

        // update model active view
        this.model.set( 'activeView', activeTab );

        // create tagging layout
        taggingView = this.buildTabMainView({ name: activeTab }, layout, data );

        // insert tab main-view
        tabsView.setView( '.tab-main-' + activeTab, taggingView );

        // render view
        taggingView.render();

        // resume success
        return true;
      }

      // 'createtags' layout
      taggingView = this.buildTabMainView( {name: 'createtags'}, layout, data );

      // insert tab main-view
      tabsView.setView( '.tab-main-' + activeTab, taggingView );

      // get first row
      var tRow = taggingView.getRowByIndex( 0 );

      // labels
      var t1 = session.get( 'sp_lang', 'SP_ModalsBody17') || Language.modals.body17[this.lang];
      var t2 = session.get( 'sp_lang', 'SP_ModalsBody16') || Language.modals.body16[this.lang];

      // validate row
      if ( !tRow ) {

        // log
        console.log( this.model.toJSON() );

        // toast
        $.publish( 'toast', [2, t1] );

        // resume error
        return false;
      }

      // open row dialog
      var dialogView = taggingView.openRowDialog({
        title: t2,
        tableId: 'createtags',
        mode: 'edit',
        rowId: tRow.getId(),
        lang: this.lang
      });

      // validate dialog view
      if ( !dialogView ) {

        // toast
        $.publish( 'toast', [2, 'something went wrong!'] );

        // resume error
        return false;
      }

      // attach custom events
      dialogView.on( 'hidden', this.togglePopup, this );
      dialogView.on( 'visible', this.togglePopup, this );

      // append dialog view into sowcard view
      this.setView( '.modal-view', dialogView );

      // render dialog
      dialogView.render();
    }

    // on back handler
    onBack(cStatus) {

      // save context
      var _self = this;

      // check popup state
      if ( this.popup ) {

        // get current dialog
        var currentDialog = this.getView( '.modal-view' );

        // check current dialog
        if ( !currentDialog ) {

          // toast and resume
          return $.publish( 'toast', [2, 'popup active but no current dialog instance!'] );
        }

        // toggle current dialog
        currentDialog();

        // resume
        return;
      }

      // get current connection status
      var connectionStatus = cStatus || session.get( 'app', 'connection' );

      // define router prefix
      var router_prefix = '';

      // define previous route
      var previousRoute = 'mainmenu';

      // get current fragment as an array
      var fragment = Backbone.history.fragment.split( '/' );

      // previous page was mainmenu
      if ( fragment.length == 3 ) {

        // navigate
        Backbone.history.navigate( previousRoute, { trigger: true } );

        // resume
        return;
      }

      // update router prefix
      router_prefix = 'w/';

      // update previous route
      previousRoute = fragment[1];

      // login controller
      var loginApi = LoginController( session );

      // define check promise
      var checkPromise;

      // check online state
      if ( connectionStatus < Const.NET_OFFLINE && typeof cStatus == 'undefined' ) {

        // check promise
        checkPromise = loginApi.checkStatus( session );
      } else {

        // resolve promise right away
        checkPromise = Promise.resolve( true );
      }

      // labels
      var t1 = session.get( 'sp_lang', 'SP_ModalsTitle5') || Language.modals.title5[this.lang];
      var t2 = session.get( 'sp_lang', 'SP_ModalsTitle11') || Language.modals.title11[this.lang];
      var t3 = session.get( 'sp_lang', 'SP_ButtonCancel') || Language.button.cancel[this.lang];
      var t4 = session.get( 'sp_lang', 'SP_ButtonOk') || Language.button.ok[this.lang];

      // check online state
      if ( this.isOnline() ) {

        // check promise
        checkPromise
          .then(function(){

            // navigate
            Backbone.history.navigate( router_prefix + previousRoute, { trigger: true } );
          })
          .catch(function(err){

            // hide spinner
            $.publish( 'spinner', [false] );

            // skip
            var skip = false;

            // generic modal
            var modal;

            // switch error code
            switch ( err.type ) {

            // no user
            case 1:

              // session expired
              $.publish('session-expired', function() {

                // attempt to go back again
                _self.onBack();
              });

              // skip
              skip = true;
              break;

            // no connection
            case 4:

              // show error dialog
              modal = AlertModal({
                title: t1,
                // message: err.message,
                message: err.message + t2,
                cancel: t3,
                confirm: t4,
                confirmVisible: true,
                cancelVisible: false
              });

              // listen for confirm event
              modal.on( 'hidden', _self.togglePopup, _self );
              modal.on( 'visible', _self.togglePopup, _self );
              modal.on('confirm', function(){

                // hide dialog
                this.hide(function(){

                  // go back ok
                  _self.onBack();
                });
              });
              break;

            default:

              // show error dialog
              modal = AlertModal({
                title: t1,
                message: err.message,
                cancel: t3,
                confirm: t4,
                confirmVisible: true,
                cancelVisible: false
              });

              // listen for confirm event
              modal.on( 'hidden', _self.togglePopup, _self );
              modal.on( 'visible', _self.togglePopup, _self );
              modal.on('confirm', function(){

                // hide dialog
                this.hide(function(){

                  // go back
                  _self.onBack();
                });
              });
              break;
            }

            // check skip
            if ( skip ) return;

            // set modal view
            _self.setView( '.modal-view', modal );

            // render alert modal
            modal.render();
          });
      } else {

        // check real connection status
        if ( connectionStatus < Const.NET_OFFLINE ) {

          // check status
          checkPromise
            .then(function(){

              // update connection state
              $.publish( 'connection-change', [Const.NET_CONNECTED] );

              // check if sowcard is not dirty
              if ( !_self.model.get('isDirty') ) {

                // navigate
                Backbone.history.navigate( router_prefix + previousRoute, { trigger: true } );
              } else {

                // get sowcard layout
                var sowcardLayout = _self.model.get( 'layout' );
                var sowcardData = _self.model.get( 'data' );

                // synchronyze sowcard
                return _self
                  .syncData( sowcardLayout, sowcardData, Const.NET_CONNECTED )
                  .then(function(response){

                    // empty response
                    if ( !response ) return;

                    // error response
                    if ( typeof response == 'string' && response.charAt(0) == '!' ) {

                      // throw error
                      throw {
                        type: 2,
                        source: 'ServerError',
                        message: response.substring( 1, response.length )
                      };
                    }
                  })
                  .then(function(){

                    // navigate
                    Backbone.history.navigate( router_prefix + previousRoute, { trigger: true } );
                  });
              }
            })
            .catch(function(err){

              // get error type
              var errType = getProp( err, ['type'], -1 );

              // check error type
              if ( errType == 1 ) {

                // session-expired
                $.publish('session-expired', function() {

                  // attempt to go back again
                  _self.onBack( cStatus );
                });
              } else {

                // show error dialog
                var modal = AlertModal({
                  title: t1,
                  message: err.message,
                  cancel: t3,
                  confirm: t4,
                  confirmVisible: true,
                  cancelVisible: false
                });

                // listen for confirm event
                modal.on( 'hidden', _self.togglePopup, _self );
                modal.on( 'visible', _self.togglePopup, _self );
                modal.on('confirm', function(){

                  // hide dialog
                  this.hide(function(){

                    // on back
                    _self.onBack( cStatus );
                  });
                });

                // set modal view
                _self.setView( '.modal-view', modal );

                // render login modal and resume
                modal.render();
              }

              // progress = false
              $.publish( 'progress', [false] );

              // log
              console.log( err );

              // toast
              // $.publish( 'toast', [2, Language.menubar.errorMsg4[_self.lang]] );
            });
        } else {

          // navigate
          Backbone.history.navigate( router_prefix + previousRoute, { trigger: true } );
        }
      }
    }

    /**
     * [onBluetooth description]
     * @return {[type]} [description]
     */
    onBluetooth() {

      // get active modal
      var btModal = this.getView( '.modal-view' );

      // check if active modal is a bluetooth modal
      if ( btModal && btModal instanceof BluetoothModal ) {

        // toggle bluetooth modal
        btModal.toggle();

        // resume
        return;
      }

      // create bluetooth modal
      btModal = new BluetoothModal( this.lang );

      // listen for custom events
      btModal.on('hidden', this.togglePopup, this );
      btModal.on('visible', this.togglePopup, this );

      // append dialog view into sowcard view
      this.setView( '.modal-view', btModal );

      // render session modal and resume
      btModal.render();
    }

    // on browse
    onBrowse(ev, direction, number) {

      // prevent event propagation
      ev.stopPropagation();

      // resume
      this.requestCard( direction, number );
    }

    requestCard(direction, number, makeActive, key) {
      var isOnline = session.get('app', 'connection') == Const.NET_CONNECTED;

      // get layout
      var layout = this.model.get( 'layout' );

      // fetch card promise
      var fetchCard;

      // define options
      var options = {
        key: key || 'number',
        value: number,
        layout: layout,
        operation: direction,
        makeActive: makeActive,
        isOnline: isOnline
      };

      // show spinner
      $.publish( 'spinner', [true] );

      // labels
      var t1 = session.get( 'sp_lang', 'SP_ModalsTitle9') || Language.modals.title9[this.lang];
      var t2 = session.get( 'sp_lang', 'SP_MenubarErrorMsg4') || Language.menubar.errorMsg4[this.lang];

      // online
      if ( isOnline ) {

        // online
        fetchCard = this.getOnlineCard( options );
      } else if ( session.get('app', 'connection') == Const.NET_OFFLINE ) {

        // get current card data
        var currentCard = this.model.get( 'data' );

        // get card state
        var cardState = session.get( 'card', layout.requestKey );

        // prevent requesting next card
        if ( direction == '>' && (currentCard.index == cardState.maxIndex - 1) ) {

          // hide spinner
          $.publish( 'spinner', [false] );

          // toast
          return $.publish( 'toast', [2, t1] );
        }

        // prevent requesting previous card
        if ( direction == '<' && !currentCard.index ) {

          // hide spinner
          $.publish( 'spinner', [false] );

          // toast
          return $.publish( 'toast', [2, t1] );
        }

        // direction next or previous
        if ( direction !== '=' ) {

          // redefine key
          options.key = 'index';

          // update current index
          options.value = currentCard.index;
        }

        // previous
        if ( direction == '<' ) {

          // update value
          options.value -= 1;
        }

        // next
        if ( direction == '>' ) {

          // update value
          options.value += 1;
        }

        // create query
        var query = {
          layout: layout.requestKey
        };

        // update query
        query[options.key] = options.value;

        // get offline card
        fetchCard = this.getOfflineCard( query, options );
      } else {

        // hide spinner
        $.publish( 'spinner', [false] );

        // toast and resume
        return $.publish( 'toast', [2, t2] );
      }

      // then
      return fetchCard
        .then( this.updateActiveTab.bind(this) )
        .then( this.renderData.bind(this) )
        .then(function(data){

          // log
          log( 'requestCard', data );

          // get current fragment as an array
          var fragment = Backbone.history.fragment.split( '/' );

          // update fragment with current card number
          fragment[fragment.length - 1] = data.number;

          // update fragment
          Backbone.history.navigate( fragment.join('/'), {replace: true} );

          // hide spinner
          $.publish( 'spinner', [false] );
        })
        .catch( this.fetchFail.bind(this, options) );
    }

    // on change tab
    onHideTab(event) {
      var layout  = this.model.get( 'layout' ),
        assignTab = this.model.get( 'assignTab' ),
        storeName = layout.requestKey;

      // get persisted active view
      var savedActiveTab = session.get( 'card', storeName, 'active' );

      // get href attribute
      // event.target = current active tab
      // event.relatedTarget = new soon-to-be-active tab
      var href = $( event.relatedTarget ).attr( 'href' );

      // get active tab name out of the tab link
      var activeTab = href.split( '-' )[1];

      // check active tab
      if ( activeTab == 'danbredtagging' ) {

        // check assign tab
        if ( !assignTab ) {

          // prevent default event
          event.preventDefault();
          event.stopPropagation();

          // toast
          // TODO: change toast message
          $.publish( 'toast', [2, 'tildel avl funktion er inaktiv!'] );

          // resume
          return;
        }

        // tildel/avlsid routine (returns boolean success/error)
        var ok = this.tildelAvl( activeTab );

        // check if success
        if ( !ok ) {

          // prevent default event
          event.preventDefault();
          event.stopPropagation();
        }

        // simply resume
        return;
      }

      // update model active view
      this.model.set( 'activeView', activeTab );

      // check active tab
      if ( activeTab == 'exit' && activeTab !== savedActiveTab ) {

        // edit first row
        this.trigger( 'edit-row', activeTab, 0 );
      }

      // persist state
      session.set( 'card', storeName, 'active', activeTab ).persist();
    }

    editRemark(newRemark) {
      var _self = this;

      // get data and layout
      var data   = this.model.get( 'data' );
      var layout = this.model.get( 'layout' );

      // check new remark
      if ( data.remark == newRemark ) return;

      // update remark
      data.remark = newRemark;

      // update remark is dirty
      data.remarkIsDirty = 1;

      // update is dirty
      data.isDirty = 1;

      // update data
      this
        .syncData( layout, data, session.get('app', 'connection') )
        .then(function(result){

          // online mode
          if ( session.get('app', 'connection') == Const.NET_CONNECTED ) {

            // result = '' (empty)
            if ( typeof result == 'string' && !result ) return;

            // error response
            if ( result && typeof result == 'string' && result.charAt(0) == '!' ) {

              // throw error
              throw {
                type: 2,
                source: 'Server',
                message: result.substring( 1, result.length )
              };
            }

            // update is dirty
            data.isDirty = 0;

            // clear remark isdirty
            data.remarkIsDirty = 0;
          }

          // update model data
          _self.model.set( 'data', data );
        })
        .catch(function(err){

          // local vars
          var errMsg, errSrc;

          // get vars
          errMsg = getProp( err, ['message'], err.toString() );
          errSrc = getProp( err, ['source'], 'Database' );

          // hide spinner
          $.publish( 'spinner', [false] );

          // labels
          var t1 = session.get( 'sp_lang', 'SP_IndexErrorMsg6') || Language.index.errorMsg6[_self.lang];

          // toast
          $.publish( 'toast', [2, errSrc + ' ' + capitalize( t1 ) + ': ' + errMsg] );
        });
    }

    editRow(tabName, rIndex){
      var setDate = true,
        tabView = this.getActiveView();

      // validate tab view
      if ( !tabView ) return;

      // get row by index
      var tRow = tabView.getRowByIndex( rIndex );

      // validate row
      if ( !tRow ) {

        // toast and resume
        return $.publish( 'toast', [2, 'Could not get row by index: ' + rIndex + ' @BaseCardView:editRow()!'] );
      }

      // get row id
      var rowId = tRow.getId();

      // labels
      var t1 = session.get( 'sp_lang', 'SP_ButtonEditRow') || Language.button.editRow[this.lang];

      // get main component
      var options = {
        title: t1,
        tableId: this.model.get('activeView'),
        mode: 'edit',
        rowId: rowId,
        setDate: setDate,
        lang: this.lang
      };

      // open row dialog
      var dialogView = tabView.openRowDialog( options );

      // validate dialog view
      if ( dialogView ) {

        // attach custom events
        dialogView.on( 'hidden', this.togglePopup, this );
        dialogView.on( 'visible', this.togglePopup, this );

        // append dialog view into sowcard view
        this.setView( '.modal-view', dialogView );

        // render dialog
        dialogView.render();
      }
    }

    /**
     * on add row handler (called by toolbar button)
     * @return {[type]} [description]
     */
    onAddRow() {
      var setDate = true,
        tabView = this.getActiveView();

      // validate tab view
      if ( !tabView ) return;

      // labels
      var t1 = session.get( 'sp_lang', 'SP_ButtonAddRow') || Language.button.addRow[this.lang];

      // get main component
      var options = {
        title: t1,
        tableId: this.model.get('activeView'),
        mode: 'create',
        rowId: 'a',

        // update sate date to match the current layout
        setDate: setDate,
        lang: this.lang
      };

      // open row dialog
      var dialogView = tabView.openRowDialog( options );

      // validate dialog view
      if ( dialogView ) {

        // attach custom events
        dialogView.on( 'hidden', this.togglePopup, this );
        dialogView.on( 'visible', this.togglePopup, this );

        // append dialog view into sowcard view
        this.setView( '.modal-view', dialogView );

        // render dialog
        dialogView.render();
      }
    }

    // mainly responsible for creating a new row/creating a new card
    onPositive(dialog, options, tRow, bool) {
      var data, newCardModel,

        // describes the way sowcard model should be handled
        // should this method work with a copy of data model (forReal = false) or
        // directly with the data model (forReal = true)
        forReal   = false,
        _self     = this,
        layout    = this.model.get( 'layout' ),
        cardState = session.get( 'card', layout.requestKey ),
        isOffline = session.get('app', 'connection') > Const.NET_CONNECTED;

      // log
      log( 'options = ' + JSON.stringify(options) );

      // actually check the tableId
      var tableId = getProp( options, ['tableId'], this.model.get('activeView') );

      // get mode
      var mode = getProp( options, ['mode'] );

      // define skip
      let skip = false;

      // check table id
      switch( tableId ) {
      case 'entry':

        // get key and value
        var key   = getProp( options, ['key'], this.model.get('activeView') );
        var value = getProp( options, ['value'], this.model.get('activeView') );

        // new empty card
        newCardModel = new CardModel({ layout: layout });

        // update new card
        newCardModel.updateCard( key, value );

        // update new card
        newCardModel.updateCard( 'layout', this.tableName );

        // update new card
        newCardModel.updateCard( 'isDirty', 1 );

        // update new card
        newCardModel.updateCard( 'index', cardState.maxIndex );

        // check connection
        if ( isOffline ) {

          // update max index
          session.set( 'card', layout.requestKey, 'maxIndex', cardState.maxIndex + 1 ).persist();
        }

        // insert entry row
        newCardModel.insertCardRow( 'entry', tRow.toJSON() );

        // create empty litter
        var emptyLitter = new Row({
          id: utils.generateRowId(),
          no: 0,
          editable: 1,
          removable: 0,
          rIndex: 0,
        });

        // update kuld no
        emptyLitter.setValue( 0, 0 );

        // create empty row using table layout
        if ( !emptyLitter.updateEmptyRow( layout.thead ) ) {

          // resume
          return false;
        }

        // log
        log( emptyLitter.toJSON() );

        // insert entry row
        newCardModel.insertCardRow( 'litters', emptyLitter.toJSON() );

        // get new card data
        data = newCardModel.get( 'data' );
        break;
      case 'exit':

        // check connection state
        // in offline mode work directly with sowcard model
        if ( isOffline ) {

          // update working mode
          forReal = true;

          // set card as dirty
          this.model.updateCard( 'isDirty', 1 );
        }

        // manage new row (insert mode, copy data model)
        data = this.manageRow( tRow, false, forReal );

        // update for real
        forReal = true;
        break;
      case 'createtags':

        // log
        log( options );
        log( tRow.toJSON() );

        // create tags and resume
        this
          .createTags( layout, tRow.toJSON(), session.get('app', 'connection'), bool )
          .then(function( danbredtaggingRows ){

            // log
            log( 'object', danbredtaggingRows );

            // render data
            return _self
              .renderData( danbredtaggingRows )
              .then(function(){

                // hide dialog
                dialog.toggle();

                // activate tab
                _self.activateTab( 'danbredtagging' );
              });
          })
          .catch(function(err){
            var errType = getProp( err, ['type'], 2 ),
              errorMsg  = getProp( err, ['message'], err.toString() );

            // create tags error
            if ( errType == 7 ) {

              // hide modal
              dialog.hide(function(){

                // labels
                var t1 = session.get( 'sp_lang', 'SP_Toast19') || Language.toast[19][ _self.lang ];
                var t2 = session.get( 'sp_lang', 'SP_ButtonNo') || Language.button.no[ _self.lang ];
                var t3 = session.get( 'sp_lang', 'SP_ButtonYes') || Language.button.yes[ _self.lang ];

                // create alert modal
                // Would You Like to Create The Remaining Tag ID's?
                var alertModal = AlertModal({
                  title: t1,
                  message: errorMsg,
                  cancel: t2,
                  confirm: t3,
                  confirmVisible: true,
                  cancelVisible: true
                });

                // listen for custom events
                alertModal.on( 'visible', _self.togglePopup, _self );
                alertModal.on( 'hidden', _self.togglePopup, _self );
                alertModal.on('confirm', function(){

                  // on positive again
                  _self.onPositive( this, options, tRow, true );
                });

                // render alert
                alertModal.render();
              });
            } else {

              // log
              log( errorMsg );

              // toast
              $.publish( 'toast', [2, errorMsg] );

              // hide modal
              dialog.toggle();
            }
          });

        // update skip flag
        skip = true;

        // fake skip
        if ( skip ) return;
        break;
      default:

        // check connection state
        // in offline mode work directly with sowcard model
        if ( isOffline ) {

          // update working mode
          forReal = true;

          // update model is dirty
          this.model.updateCard( 'isDirty', 1 );
        }

        // manage new row (insert mode, copy data model)
        data = this.manageRow( tRow, true, forReal );
        break;
      }

      // update data
      this
        .syncData( layout, data, session.get('app', 'connection') )
        .then(function(result){
          var rowId, addRow,
            tab = { name: options.tableId };

          // online mode
          if ( !isOffline ) {

            // result = '' (empty)
            if ( typeof result == 'string' && !result ) {
              if ( !tRow.clearDirty() ) {

                // throw error
                throw {
                  type: 6,
                  source: 'SmartPigs',
                  message: 'could not clear dirty on row id = ' + tRow.getId()
                };
              }

              // edit/add
              addRow = mode == 'edit' ? false : true;

              // manage new row (insert mode, copy data model)
              data = _self.manageRow( tRow, addRow, true );

              // hide dialog and render tab view
              dialog.hide(function(){

                // refresh active view
                _self.renderTabView( data, tab );
              });

              // resume
              return;
            }

            // error response
            if ( result && typeof result == 'string' && result.charAt(0) == '!' ) {

              // throw error
              throw {
                type: 2,
                source: 'Server',
                message: result.substring( 1, result.length )
              };
            }

            // convert result to number
            rowId = utils.toNumber( result );

            // check result
            if ( typeof rowId !== 'number' ) {

              // throw error
              throw {
                type: 2,
                source: 'Server',
                message: 'Invalid id: ' + result
              };
            }

            // log
            log( 'new ID = ' + result );

            // clear dirty
            if ( !tRow.clearDirty() ) {

              // throw error
              throw {
                type: 6,
                source: 'SmartPigs',
                message: 'could not clear dirty on row id = ' + tRow.getId()
              };
            }

            // update id
            if ( !tRow.setId(rowId) ) {

              // throw error
              throw {
                type: 6,
                source: 'SmartPigs',
                message: 'could not update row with id = ' + result
              };
            }

            // check tab name
            if ( tab.name == 'entry' ) {

              // log
              log( 'object', tRow.toJSON() );

              // insert entry row
              newCardModel.updateCardRowByIndex( 'entry', tRow.toJSON(), 0 );

              // get updated data
              data = newCardModel.get( 'data' );

              // log
              log( 'object', data );
            } else {

              // manage new row (insert mode, copy data model)
              data = _self.manageRow( tRow, true, true );
            }
          }

          // hide dialog
          dialog.hide(function(){

            // check tab name
            if ( tab.name == 'entry' ) {

              // update menubar with sowcard number
              menubar.updateModel({ value: options.value });

              // render views
              _self.renderViews( data );
            } else {

              // refresh active view
              _self.renderTabView( data, tab );
            }
          });
        })
        .catch(function(err){
          var errMsg = getProp( err, ['message'], err.toString() );
          var errSrc = getProp( err, ['source'], 'Database' );

          // hide spinner
          $.publish( 'spinner', [false] );

          // labels
          var t1 = session.get( 'sp_lang', 'SP_IndexErrorMsg6') || Language.index.errorMsg6[_self.lang];

          // dialog trigger error
          dialog.model.set('error', {
            visible: true,
            title: errSrc + ' ' + capitalize( t1 ) + ': ',
            message: errMsg
          });

          // manually rerender
          dialog.updateError();
        });
    }

    // cancel the dialog
    onNegative(dialog) {

      // toggle dialog
      dialog.toggle();
    }

    // on remove row helper (triggered by tab view)
    onRemoveRow(options) {
      var data, tRow,

        // describes the way sowcard model should be handled
        // should this method work with a copy of data model (forReal = false) or
        // directly with the data model (forReal = true)
        forReal   = false,
        isOffline = session.get('app', 'connection') > Const.NET_CONNECTED,
        _self     = this,
        layout    = this.model.get( 'layout' ),
        tabView   = this.getActiveView();

      // minimal check active view
      if ( !tabView ) return;

      // get table row
      tRow = tabView.getRowsBy( 'id', options.rowId, true );

      // validate table row
      if ( !tRow ) {

        // toast and resume
        return $.publish( 'toast', [2, 'SmartPigs Error: table row with id = ' + options.rowId + ', could not be found @onRemoveCardRow!'] );
      }

      // clear dirty
      if ( !tRow.setDirty(-1) ) {

        // toast and resume
        return $.publish( 'toast', [2, 'SmartPigs Error: table row with id = ' + options.rowId + ', could not be marked as dirty @onRemoveProgenyRow()!'] );
      }

      // check connection state
      // in offline mode work directly with sowcard model
      if ( isOffline ) {

        // update working mode
        forReal = true;

        // update model is dirty
        this.model.updateCard( 'isDirty', 1 );
      }

      // manage new row (update mode, copy data model)
      data = this.manageRow( tRow, false, forReal );

      // update data
      this
        .syncData( layout, data, session.get('app', 'connection') )
        .then(function(result){
          var tab = { name: options.tableId };

          // check connection state
          if ( !isOffline ) {

            // check result
            if ( result && result[0] == '!' ) {
              throw {
                type: 6,
                source: 'Server',
                message: result.substring( 1, result.length )
              };
            }

            /**
             * TODO
             *
             * => working hack. need to use removeEntry call
             */

            // update model data
            _self.model.updateData( data );
          } else {

            // check if result is array
            if ( !result.length ) {
              throw {
                type: 6,
                source: 'SmartPigs',
                message: 'on saving new card in the database'
              };
            }
          }

          // refresh active view
          _self.renderTabView( data, tab );
        })
        .catch(function(err){
          var errMsg = getProp( err, ['message'], err.toString() );
          var errSrc = getProp( err, ['source'], 'Database' );

          // labels
          var t1 = session.get( 'sp_lang', 'SP_IndexErrorMsg6') || Language.index.errorMsg6[_self.lang];

          // hide spinner
          $.publish( 'spinner', [false] );

          // toast
          $.publish( 'toast', [2, errSrc + ' ' + capitalize( t1 ) + ': ' + errMsg + ' @onRemoveRow!'] );
        });
    }

    // on reader result
    onReaderResult(event, attr, value) {

      // barcode result => card number
      if ( attr == 'reader-barcode' ) {

        // if offline -> update attr
        attr = 'number';
      }

      // check if no type -> HF reader result
      if ( typeof attr == 'undefined' ) {

        // update type
        attr = 'uhfrfid';

        // replace white spaces
        value = value.replace(/\s+/g, '');
      }

      // select focused element
      // var $focusedInputField = this.$('input[name="active-field"]');
      var $focusedInputField = this.$( 'input:focus' );

      // check if editableId element exists
      if ($focusedInputField.length) {

        // update input field and resume
        // this.$('input[name="active-field"]').val( value );
        $focusedInputField.val( value ).caret( value.length );

        // resume
        return;
      }

      // check for popup
      if ( this.popup ) {

        // get active dialog
        var dialogView = this.getView( '.modal-view' );

        // check active dialog view
        if ( !dialogView ) return;

        // get form view
        var formView = dialogView.getView( '.body-component' );

        // check form view
        if ( !formView ) return;

        // update dialog view form
        return formView.updateField( value );
      }

      // define options
      var options = {
        key: attr,
        operation: '=',
        isOnline: session.get( 'app', 'connection' ) == Const.NET_CONNECTED
      };

      // update options
      options[ attr ] = value;

      // fetch data and resume
      this
        .fetchData( options )
        .then( this.renderData.bind(this) )
        .then(function(){

          // hide spinner
          $.publish( 'spinner', [false] );
        })
        .catch( this.fetchFail.bind(this, options) );
    }

    // switch litters view
    switchLittersView() {
      // var _self  = this,
      var viewType = this.model.get( 'viewType' ),
        tabsView = this.getView( '.tabs-view' );

      // log
      log( 'object', this.model.toJSON() );

      // update view type
      // http://stackoverflow.com/questions/6911235/is-there-a-better-way-of-writing-v-v-0-1-0
      viewType = 1 - viewType;

      // update view type
      this.model.set( 'viewType', viewType );

      // returns a promise
      return new Promise((resolve) => {
        var tabView;

        var data   = this.model.get( 'data' );
        var layout = this.model.get( 'layout' );

        // check view type
        if ( viewType ) {

          // build tab view
          tabView = this.buildTabMainView( {name: 'thead'}, layout, data );

          // insert litters view
          tabsView.setView( '.tab-main-thead', tabView );

          // hide toolbar view
          tabsView.hideView( 'tab-extra-thead' );

          // render tabs view only
          return tabView
            .render()
            .promise()
            .done(resolve);
        }

        // define tab
        var tab = {
          name: 'thead',
          icon: 'icon_sowcardMenuItem',
          index: 0,
          addRow: false,
          active: true
        };

        // build tab view
        tabView = this.buildTabMainView( tab, layout, data );

        // insert litters view
        tabsView.setView( '.tab-main-thead', tabView );

        // show toolbar view
        tabsView.showView( 'tab-extra-thead' );

        // render tabs view
        tabView
          .render()
          .promise()
          .done(resolve);
      });
    }

    requestBaseCard(cardNumber) {

      // log
      this.requestCard( '=', cardNumber );
    }

    /**
     * create new card dialog
     * @param  {[type]} key   [description]
     * @param  {[type]} value [description]
     * @return {[type]}       [description]
     */
    createNew(options) {
      var compiled = template( Language.modals.body15[this.lang] ),
        title = compiled({ 'number': options.value }),
        entryView = this.getTabView( 'entry' );

      // check entry view
      if ( !entryView ) return;

      // dialog options
      var dialogOptions = {
        title: title,
        mode: 'create',
        rowId: 'a',
        tableId: 'entry',
        key: options.key,
        value: options.value,
        lang: this.lang,
        filterRow: options.filterRow
      };

      // open row dialog
      var dialogView = entryView.openRowDialog( dialogOptions );

      // validate dialog view
      if ( dialogView ) {

        // append dialog view into sowcard view
        this.setView( '.modal-view', dialogView );

        // setup listeners
        dialogView.on( 'visible', this.togglePopup, this );
        dialogView.on( 'hidden', this.togglePopup, this );

        // render dialog
        dialogView.render();
      }
    }

    /**
     * manage row insertion/update. create a copy of data model,
     * or work directly on data model
     * @param  {object} tRow - table row to work with
     * @param  {boolean} mode - update/insert
     * @param  {boolean} forReal - work on the copy of the data model/directly on the model
     * @return {object} - return data model
     */
    manageRow(tRow, insertMode, forReal) {
      var dataSrc     = this.model.get('activeView') == 'thead' ? 'litters' : this.model.get( 'activeView' );
      var sowcardData = forReal ? this.model.get('data') : cloneDeep( this.model.get('data') );

      // insert mode?
      if ( insertMode ) {

        // add new row
        sowcardData[dataSrc].tr.push( tRow.toJSON() );
      } else {

        // update sowcard data
        map(sowcardData[dataSrc].tr, function( row ){

          // check data src
          if ( dataSrc == 'litters' && tRow.getRowIndex() == row.rIndex ) {

            // overwrite litters table row
            extend( row, tRow.toJSON() );

            // resume
            return;
          }

          // update specific row
          if ( tRow.getId() == row.id ) {

            // overwrite table row
            extend( row, tRow.toJSON() );
          }
        });
      }

      // resume
      return sowcardData;
    }

    // sync data helper
    syncData(layout, data, connection) {
      var _self = this,
        toSend = {},
        sowcards = [];

      // offline
      if ( connection > Const.NET_CONNECTED ) {

        // get db connection
        return this
          .getConnection()
          .then(function(connection) {

            // use db connection
            return connection.updateRow( _self.tableName, data );
          })
          .then(function(result){

            // update model dirty
            _self.model.set( 'isDirty', 1 );

            // check if store is not dirty
            if ( !session.get('dirty', layout.requestKey) ) {

              // update dirty
              session.set( 'dirty', layout.requestKey, 1 ).persist();
            }

            // resolve promise
            return result;
          });
      }

      // update sowcards
      sowcards.push( data );

      // insert layout
      toSend.layout  = layout;
      toSend.sowcards = sowcards;

      // init server address
      var server_address = session.get( 'device', Const.SERVER_URL ) || '/';

      // define full request url
      var url = server_address + 'send.html?' + session.get( 'layouts', 'sessionKey' ) + '?' + layout.requestKey;

      // axios post config
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      // define online fetch promise
      return axios
        .post(url, toSend, config)
        .then(function(response) {

          // resolve promise
          return response.data;
        })
        .catch(function(){
          // throw custom error
          throw {
            type: 5,
            source: 'Server',
            message: 'No connection!',
            connectionState: Const.NET_SERVER_DOWN
          };
        });
    }

    createTags(layout, data, connection, bool) {
      var _self = this;

      // update bool (create tags anyway)
      bool = bool ? '?yes' : '';

      var toSend = {};

      // offline
      if ( connection > Const.NET_CONNECTED ) {

        // resume
        throw {
          type: 6,
          source: 'SmartPigs',
          message: 'Cannot create tags in offline mode!'
        };
      }

      // add row to the payload
      toSend.createtags = data;

      // add layout to the payload
      toSend.layout = layout;

      // init server address
      var server_address = session.get( 'device', Const.SERVER_URL ) || '/';

      // define full request url
      var url = server_address + 'send.html?' + session.get( 'layouts', 'sessionKey' ) + '?' + 'ASData_CreateTags' + bool;

      // axios post config
      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      // define online fetch promise
      return axios
        .post(url, toSend, config)
        .then(function(response) {
          try {
            var result = _self.processResponse( {}, response.data );

            // process response
            return result;
          } catch(err) {

            // handle error
            throw err;
          }
        })
        .catch(function(err){

          // get error type
          var errType = getProp( err, ['type'], -1 );

          // check error type
          if ( errType > 0 ) throw err;

          // publish connection change event
          $.publish( 'connection-change', [Const.NET_SERVER_DOWN] );

          throw {
            type: 5,
            name: 'ConnectionError',
            message: capitalize( 'no connection' ) + '!',
            connectionState: Const.NET_SERVER_DOWN
          };
        });
    }

    /**
     * update sowcard view
     * @param  {object} event - jquery event object
     * @param  {object} options - event options
     */
    updateRow(event, options) {
      event.preventDefault();
      event.stopPropagation();

      var tRow, todayDate,

        // describes the way sowcard model should be handled
        // should this method work with a copy of data model (forReal = false) or
        // directly with the data model (forReal = true)
        rowId      = getProp( options, ['rowId'], -1 ),
        _self      = this,
        data       = this.model.get( 'data' ),
        layout     = this.model.get( 'layout' ),
        tabView    = this.getActiveView(),
        isOffline  = session.get('app', 'connection') > Const.NET_CONNECTED,
        dateFormat = session.get( 'settings', 'dateFormat' );

      // if simple row id
      if ( rowId.toString().indexOf(',') < 0 ) {

        // get row
        tRow = tabView.getRowsBy( 'id', rowId, true );

        // update value and update dirty
        tRow.setValue( options.cIndex, options.newValue, true );
      } else {

        // get row
        tRow = tabView.getRowsBy( 'rIndex', options.rIndex, true );

        // update value and update dirty
        tRow.setValue( options.cIndex, options.newValue, true );
      }

      // check table row
      if ( !tRow ) return false;

      // check if 'exit' view
      if ( options.tableId == 'exit' ) {

        // get column index
        var exitDateIndex = tabView.findColumnBy('sClass', 'ExitDate');

        //  column index minimal check
        if ( exitDateIndex && !isNaN(exitDateIndex) && options.iClick !== 11 ) {

          // check if value exit date is not set
          if ( !tabView.getValue(options.rIndex, exitDateIndex).length ) {

            // todays date
            // todayDate = Moment().format( dateFormat ).toString();
            todayDate = DateFormat.asString( dateFormat, new Date() );

            // update value with todays date
            tabView.setValue(options.rIndex, exitDateIndex, todayDate, true);
          }
        }
      }

      // check connection state
      // in offline mode work directly with sowcard model
      if ( isOffline ) {

        // update model is dirty
        this.model.updateCard( 'isDirty', 1 );
      }

      // manage new row (update mode, copy data model)
      data = this.manageRow( tRow, false, true );

      // update data
      this
        .syncData( layout, data, session.get('app', 'connection') )
        .then(function( result ){
          var rId;

          // check state
          if ( !isOffline ) {

            // error response
            if ( result && typeof result == 'string' && result.charAt(0) == '!' ) {

              // throw error
              throw {
                type: 2,
                source: 'Server',
                message: result.substring( 1, result.length )
              };
            }

            // convert result to number
            rId = utils.toNumber( result );

            // check if it's valid number
            if ( isNaN(rId) ) {

              // check result again
              if ( !result ) {

                // clear dirty
                if ( !tRow.clearDirty() ) {

                  // throw error
                  throw {
                    type: 6,
                    source: 'SmartPigs',
                    message: 'cannot clear dirty row with id = ' + tRow.getId()
                  };
                }

                // log
                log( 'object', _self.model.get('data') );

                // resume
                return;
              }
            }

            // check row id
            else if ( typeof rId == 'number' ) {

              // clear dirty flag
              tRow.clearDirty();

              // update id
              tRow.setId( rId );
            } else {
              try{

                // get row id as an array
                rId = JSON.parse( result );

                // update id
                tabView.setId( options.rIndex, rId );
              } catch(e) {

                // get the actual id from the array
                log( result );
                log( options );
                log( e.toString() );
              }
            }

            // manage new row (update mode, copy data model)
            data = _self.manageRow( tRow, false, true );
          } else {

            // check if result is array
            if ( !result.length ) {

              // throw error
              throw {
                type: 6,
                source: 'SmartPigs',
                message: 'on saving new card in the database'
              };
            }
          }

          // rerender top view
          _self.render();
        })
        .catch(function(err){

          // get vars
          var errMsg = getProp( err, ['message'], err.toString() );
          var errSrc = getProp( err, ['source'], 'Database' );

          // hide spinner
          $.publish( 'spinner', [false] );

          // labels
          var t1 = session.get( 'sp_lang', 'SP_IndexErrorMsg6') || Language.index.errorMsg6[_self.lang];

          // toast
          $.publish( 'toast', [2, errSrc + ' ' + capitalize( t1 ) + ': ' + errMsg] );
        });
    }

    // remove custom events
    cleanup() {
      $.unsubscribe( 'browse.basecard' );
      $.unsubscribe( 'update-view.basecard' );
      $.unsubscribe( 'reader-result.basecard' );
    }
  };
};
