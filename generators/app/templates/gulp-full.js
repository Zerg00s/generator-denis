var gulp = require('gulp');
var sppull = require('sppull').sppull;
var spsave = require("gulp-spsave");
var watch = require("gulp-watch");
var prompt = require("gulp-prompt");
var config = require('./config.extend');
var open = require('open');
var csomapi = require('csom-node');
var deferred = require('deferred');

gulp.task('touch-conf', function() {
    console.log("Checking configs...");
    return gulp.src('').pipe(config.validateLocalConfig());
});

gulp.task('sppull-all', ['touch-conf'], function(cb) {
    console.log("Pulling from SharePoint");
    sppull(config, config)
        .then(function() {
            cb();
        })
        .catch(function(err) {
            cb(err);
        });
});

gulp.task("watch-assets", ['touch-conf'], function () {
    console.log("Watch Assets");
    
    var assets = config.dlRootFolder.replace("./", "") + "/**/*.*";
    var base = config.dlRootFolder.replace("./", "");
    var coreOptions = {
        siteUrl: config.siteUrl,
        folder: config.spRootFolder,
        flatten: false,
        checkin: true,
        checkinType: 1
    };
    return watch(assets, function (event) {
        console.log(event.path);
        gulp.src(event.path, {
            base: base
        }).pipe(spsave(coreOptions, config));
    });
});

gulp.task("publish", ['touch-conf'], function () {
    console.log("Publish Assets");
    var assets = config.dlRootFolder.replace("./", "") + "/**/*.*";
    var base = config.dlRootFolder.replace("./", "");
    var coreOptions = {
        siteUrl: config.siteUrl,
        folder: config.spRootFolder,
        flatten: false,
        checkin: true,
        checkinType: 1
    };
    return gulp.src(assets, { base: base })
            .pipe(spsave(coreOptions, config));
});


//Replace contents of the file:
var fs = require('fs')
gulp.task("replace", function () {

    fs.readFile('foo.txt', 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        var result = data.replace(/DENIS/g, 'ALEX');

        fs.writeFile('foo.txt', result, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });
 });




//get list of fields from the sp list
gulp.task('getFields',function() {
    //read more about Cpass here: https://github.com/s-KaiNet/sp-request
    var cpass = new Cpass();
    var credentialOptions = {
        'username': config.username,
        'password': config.password,
    };

    function initializeField(result) {
        var retVal = {};
        retVal.Id = result.Id;
        retVal.FieldDisplayName = result.Title;
        retVal.FieldInternalName = result.InternalName;
        retVal.FieldType = result.TypeAsString;
        retVal.Required = result.Required;
        retVal.ReadOnlyField = result.ReadOnlyField;
        if (result.Choices) {
            retVal.Choices = result.Choices.results;
        }

        return retVal;
    };

    var spr = require('sp-request').create(credentialOptions);
    spr.get(config.siteUrl + config.webRelativeUrl + "/_api/web/lists/GetByTitle('" + config.gulp.getFields.listTitle + "')/fields?$filter=Hidden eq false")
    .then(function (response) {
        console.log(response.body.d.results);
        var results = response.body.d.results;
        var f = {};
        for (var x = 0; x < results.length; x++) {
            if (!results[x].Hidden) {
                if (results[x].InternalName != 'ContentType') {
                    if (results[x].InternalName != 'Attachments') {
                        var field = initializeField(results[x]);
                        f[results[x].InternalName] = field;                
                    }
                }
            }
        }

        console.log('Title: ' + JSON.stringify(f, null, 4));

    })
    .catch(function(err){
        console.log(err);
    });

})

// Add CEWP to all List forms 
gulp.task('addCEWP', function(){
    var siteRelativeUrl = str = '/' +  config.gulp.csom.siteUrl.replace(/^(?:\/\/|[^\/]+)*\//, "");
    console.log(str);

    csomapi.setLoaderOptions({url: config.gulp.csom.siteUrl});  //set CSOM library settings
    var authCtx = new AuthenticationContext(config.gulp.csom.siteUrl);
    authCtx.acquireTokenForUser(config.username, config.password, function (err, data) {

        //Custom executeQuery that returns a promise! :)
        // you can also pass optional data to the promise
        SP.ClientContext.prototype.executeQuery = function(data) {
            var defer = deferred();
            this.executeQueryAsync(
                function(){ defer.resolve(data); },
                function(){ defer.reject(data); }
            );
            return defer.promise;
        };

        var ctx = new SP.ClientContext(siteRelativeUrl);  //set root web
        authCtx.setAuthenticationCookie(ctx);  //authenticate         
        var web = ctx.get_web();

        var list = web.get_lists().getByTitle(config.gulp.csom.listTitle);
        ctx.load(list, [ // Request extra list properties:
            "DefaultEditFormUrl",
            "DefaultNewFormUrl",
            "DefaultDisplayFormUrl", 
            "Title"]);

        ctx.executeQuery()
        .then( function () {
            console.log(list.get_title());
            var dispForm  = list.get_defaultEditFormUrl();
            var editForm  = list.get_defaultNewFormUrl();
            var newForm   =  list.get_defaultDisplayFormUrl();
            var forms =  [dispForm, editForm, newForm];
            return forms;
        })
        .then(function(forms){

            var webPartColleciton = [];
            forms.forEach(function(form) {
                var file = web.getFileByServerRelativeUrl(form);
                var webPartMngr = file.getLimitedWebPartManager(SP.WebParts.PersonalizationScope.shared);
                var webparts = webPartMngr.get_webParts();
                ctx.load(webparts); 
                webPartColleciton.push(webparts);
            });
        
            return ctx.executeQuery({'webparts':webPartColleciton,'forms': forms});  
        })
        .then(function(data) {            
              try{
                  data.webparts.forEach(function(webparts){
                    for(var i = 1; i < webparts.getEnumerator().$8_0.length; i++){
                      var webpart = webparts.get_item(i);
                      webpart.deleteWebPart();
                     }
                  })
              }
              catch(Example){
                    console.log(Example);
              }
               return ctx.executeQuery(data.forms);
            })
        .then(function(forms) {
                var webPartXml = '<?xml version="1.0" encoding="utf-8"?>' +
                        '<WebPart xmlns="http://schemas.microsoft.com/WebPart/v2">' +
                            '<Assembly>Microsoft.SharePoint, Version=16.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c</Assembly>' + 
                            '<TypeName>Microsoft.SharePoint.WebPartPages.ContentEditorWebPart</TypeName>' + 
                            '<Title>Content Editor</Title>' +
                            '<Description>$Resources:core,ContentEditorWebPartDescription;</Description>' +
                            '<PartImageLarge>/_layouts/15/images/mscontl.gif</PartImageLarge>' +
                        '</WebPart>';
                forms.forEach(function(form){
                    var file = web.getFileByServerRelativeUrl(form);
                    var webPartMngr = file.getLimitedWebPartManager(SP.WebParts.PersonalizationScope.shared);
                    var webPartDef = webPartMngr.importWebPart(webPartXml);
                    var webPart = webPartDef.get_webPart();
                    webPartMngr.addWebPart(webPart, 'Main', 1);

                    ctx.load(webPart);

                    ctx.executeQueryAsync(
                    function(info) {
                        //get base site url:
                        pathArray = config.gulp.csom.siteUrl.split( '/' );
                        protocol = pathArray[0];
                        host = pathArray[2];
                        url = protocol + '//' + host;

                        //\033[31m red console color
                        console.info('Web part successfully added to the form '+ url + form);
                        var UrlToOpen = config.siteUrl + "/" + config.spRootFolder;
                        open(url + form);
                    },
                        function(){console.log('error')}
                    );
                })

        })// then
        .catch(function(err){
            console.log(err);
        });
        
    });
})
//Get new secure string pass:
//Example of Use:
//gulp createPass --pass MySecrePass
gulp.task('createPass', function(){
    var Cpass = require("cpass");
    var cpass = new Cpass();
    var password = process.argv[4];
    var secured = cpass.encode(password);
    console.log(secured);
} );


gulp.task('open', function(){
    var UrlToOpen = config.siteUrl + "/" + config.spRootFolder;
    open(UrlToOpen);
})


gulp.task('scriptlink', function(){
    var credentialOptions = {
        'username': config.username,
        'password': config.password,
    };
    var spr = require('sp-request').create(credentialOptions);

    spr.get(config.siteUrl + "/_api/site/UserCustomActions")
    .then(function (response) {
        var results = response.body.d.results;
        for (var x = 0; x < results.length; x++) {
            var customAction = results[x];
            console.log(customAction);                
        }
    })
    .catch(function(err){
        console.log(err);
    });

    spr.requestDigest(config.siteUrl)
    .then(function (digest) {
        return spr.post(config.siteUrl + "/_api/site/UserCustomActions", {
            body: {
               '__metadata': { 'type': 'SP.UserCustomAction' }, 'Location':'ScriptLink',
                    'Sequence':'101', 'Title':'CustomForms', 'ScriptSrc':'~siteCollection/_catalogs/masterpage/src/form_templates.js' 
            },
            headers: {
                'X-RequestDigest': digest,
                "X-HTTP-Method": "POST"
            }
        })
        .then(function (response) {
            console.log('Custom action updated');
        }, function (err) {
            console.log(err);
        });
    });
});