<%@page import="de.xima.fc.jpa.context.EntityContextFactory"%>
<%@page import="org.apache.commons.lang3.StringUtils"%>
<%@page import="org.omnifaces.util.Json"%>
<%@page import="org.json.JSONArray"%>
<%@page import="java.util.List"%>
<%@page import="java.util.Locale"%>
<%@page import="java.util.Map"%>
<%@page import="java.util.HashMap"%>
<%@page import="de.xima.fc.entities.Textbaustein"%>
<%@page import="de.xima.fc.entities.Status"%>
<%@page import="de.xima.fc.mdl.enums.EVerarbeitungsTyp"%>
<%@page import="de.xima.fc.entities.Projekt"%>
<%@page import="de.xima.fc.entities.Bedingung"%>
<%@page import="de.xima.fc.entities.Aktion"%>
<%@page import="de.xima.fc.entities.BenutzerGruppe"%>
<%@page import="de.xima.fc.interfaces.processing.IProcessing"%>
<%@page import="de.xima.fc.bl.fdv.processing.*"%>
<%@page import="de.xima.fc.user.UserContext"%>
<%@page import="de.xima.fc.user.UserContextFactory"%>
<%@page import="de.xima.fc.interfaces.IEntityContext"%>
<%@page contentType="application/json; charset=UTF-8"%>
<%@page import="org.json.JSONObject"%>
<%@page import="de.xima.fc.dao.DaoProvider"%>

<%!public void fillImageFontMap(Map<String,Integer> imageFontMap) {
    imageFontMap.put("icon-laptop",59392);
    imageFontMap.put("icon-tablet",59393);
    imageFontMap.put("icon-mobile",59394);
    imageFontMap.put("icon-inbox",59395);
    imageFontMap.put("icon-globe",59396);
    imageFontMap.put("icon-sun",59397);
    imageFontMap.put("icon-cloud",59398);
    imageFontMap.put("icon-flash",59399);
    imageFontMap.put("icon-moon",59400);
    imageFontMap.put("icon-umbrella",59401);
    imageFontMap.put("icon-flight",59402);
    imageFontMap.put("icon-fighter-jet",59403);
    imageFontMap.put("icon-paper-plane",59404);
    imageFontMap.put("icon-paper-plane-empty",59405);
    imageFontMap.put("icon-space-shuttle",59406);
    imageFontMap.put("icon-leaf",59407);
    imageFontMap.put("icon-font",59408);
    imageFontMap.put("icon-bold",59409);
    imageFontMap.put("icon-italic",59410);
    imageFontMap.put("icon-header",59411);
    imageFontMap.put("icon-paragraph",59412);
    imageFontMap.put("icon-text-height",59413);
    imageFontMap.put("icon-text-width",59414);
    imageFontMap.put("icon-align-left",59415);
    imageFontMap.put("icon-align-center",59416);
    imageFontMap.put("icon-align-right",59417);
    imageFontMap.put("icon-align-justify",59418);
    imageFontMap.put("icon-list",59419);
    imageFontMap.put("icon-indent-left",59420);
    imageFontMap.put("icon-indent-right",59421);
    imageFontMap.put("icon-list-bullet",59422);
    imageFontMap.put("icon-list-numbered",59423);
    imageFontMap.put("icon-strike",59424);
    imageFontMap.put("icon-underline",59425);
    imageFontMap.put("icon-superscript",59426);
    imageFontMap.put("icon-subscript",59427);
    imageFontMap.put("icon-table",59428);
    imageFontMap.put("icon-columns",59429);
    imageFontMap.put("icon-crop",59430);
    imageFontMap.put("icon-scissors",59431);
    imageFontMap.put("icon-paste",59432);
    imageFontMap.put("icon-briefcase",59433);
    imageFontMap.put("icon-suitcase",59434);
    imageFontMap.put("icon-ellipsis",59435);
    imageFontMap.put("icon-ellipsis-vert",59436);
    imageFontMap.put("icon-off",59437);
    imageFontMap.put("icon-road",59438);
    imageFontMap.put("icon-list-alt",59439);
    imageFontMap.put("icon-qrcode",59440);
    imageFontMap.put("icon-barcode",59441);
    imageFontMap.put("icon-book",59442);
    imageFontMap.put("icon-ajust",59443);
    imageFontMap.put("icon-tint",59444);
    imageFontMap.put("icon-check",59445);
    imageFontMap.put("icon-check-empty",59446);
    imageFontMap.put("icon-circle",59447);
    imageFontMap.put("icon-circle-empty",59448);
    imageFontMap.put("icon-circle-thin",59449);
    imageFontMap.put("icon-circle-notch",59450);
    imageFontMap.put("icon-dot-circled",59451);
    imageFontMap.put("icon-asterisk",59452);
    imageFontMap.put("icon-gift",59453);
    imageFontMap.put("icon-fire",59454);
    imageFontMap.put("icon-magnet",59455);
    imageFontMap.put("icon-chart-bar",59456);
    imageFontMap.put("icon-ticket",59457);
    imageFontMap.put("icon-credit-card",59458);
    imageFontMap.put("icon-floppy",59459);
    imageFontMap.put("icon-megaphone",59460);
    imageFontMap.put("icon-hdd",59461);
    imageFontMap.put("icon-key",59462);
    imageFontMap.put("icon-fork",59463);
    imageFontMap.put("icon-rocket",59464);
    imageFontMap.put("icon-bug",59465);
    imageFontMap.put("icon-certificate",59466);
    imageFontMap.put("icon-tasks",59467);
    imageFontMap.put("icon-filter",59468);
    imageFontMap.put("icon-beaker",59469);
    imageFontMap.put("icon-magic",59470);
    imageFontMap.put("icon-cab",59471);
    imageFontMap.put("icon-taxi",59472);
    imageFontMap.put("icon-truck",59473);
    imageFontMap.put("icon-money",59474);
    imageFontMap.put("icon-euro",59475);
    imageFontMap.put("icon-pound",59476);
    imageFontMap.put("icon-dollar",59477);
    imageFontMap.put("icon-rupee",59478);
    imageFontMap.put("icon-yen",59479);
    imageFontMap.put("icon-rouble",59480);
    imageFontMap.put("icon-try",59481);
    imageFontMap.put("icon-won",59482);
    imageFontMap.put("icon-bitcoin",59483);
    imageFontMap.put("icon-sort",59484);
    imageFontMap.put("icon-sort-down",59485);
    imageFontMap.put("icon-sort-up",59486);
    imageFontMap.put("icon-sort-alt-up",59487);
    imageFontMap.put("icon-sort-alt-down",59488);
    imageFontMap.put("icon-sort-name-up",59489);
    imageFontMap.put("icon-sort-name-down",59490);
    imageFontMap.put("icon-sort-number-up",59491);
    imageFontMap.put("icon-sort-number-down",59492);
    imageFontMap.put("icon-hammer",59493);
    imageFontMap.put("icon-gauge",59494);
    imageFontMap.put("icon-sitemap",59495);
    imageFontMap.put("icon-spinner",59496);
    imageFontMap.put("icon-coffee",59497);
    imageFontMap.put("icon-food",59498);
    imageFontMap.put("icon-beer",59499);
    imageFontMap.put("icon-user-md",59500);
    imageFontMap.put("icon-stethoscope",59501);
    imageFontMap.put("icon-ambulance",59502);
    imageFontMap.put("icon-medkit",59503);
    imageFontMap.put("icon-h-sigh",59504);
    imageFontMap.put("icon-hospital",59505);
    imageFontMap.put("icon-building",59506);
    imageFontMap.put("icon-building-filled",59507);
    imageFontMap.put("icon-bank",59508);
    imageFontMap.put("icon-smile",59509);
    imageFontMap.put("icon-frown",59510);
    imageFontMap.put("icon-meh",59511);
    imageFontMap.put("icon-anchor",59512);
    imageFontMap.put("icon-terminal",59513);
    imageFontMap.put("icon-eraser",59514);
    imageFontMap.put("icon-puzzle",59515);
    imageFontMap.put("icon-shield",59516);
    imageFontMap.put("icon-extinguisher",59517);
    imageFontMap.put("icon-bullseye",59518);
    imageFontMap.put("icon-wheelchair",59519);
    imageFontMap.put("icon-language",59520);
    imageFontMap.put("icon-graduation-cap",59521);
    imageFontMap.put("icon-paw",59522);
    imageFontMap.put("icon-spoon",59523);
    imageFontMap.put("icon-cube",59524);
    imageFontMap.put("icon-cubes",59525);
    imageFontMap.put("icon-recycle",59526);
    imageFontMap.put("icon-tree",59527);
    imageFontMap.put("icon-database",59528);
    imageFontMap.put("icon-lifebuoy",59529);
    imageFontMap.put("icon-rebel",59530);
    imageFontMap.put("icon-empire",59531);
    imageFontMap.put("icon-bomb",59532);
    imageFontMap.put("icon-adn",59533);
    imageFontMap.put("icon-android",59534);
    imageFontMap.put("icon-apple",59535);
    imageFontMap.put("icon-behance",59536);
    imageFontMap.put("icon-behance-squared",59537);
    imageFontMap.put("icon-bitbucket",59538);
    imageFontMap.put("icon-bitbucket-squared",59539);
    imageFontMap.put("icon-codeopen",59540);
    imageFontMap.put("icon-css3",59541);
    imageFontMap.put("icon-delicious",59542);
    imageFontMap.put("icon-deviantart",59543);
    imageFontMap.put("icon-digg",59544);
    imageFontMap.put("icon-dribbble",59545);
    imageFontMap.put("icon-dropbox",59546);
    imageFontMap.put("icon-drupal",59547);
    imageFontMap.put("icon-facebook",59548);
    imageFontMap.put("icon-facebook-squared",59549);
    imageFontMap.put("icon-flickr",59550);
    imageFontMap.put("icon-foursquare",59551);
    imageFontMap.put("icon-git-squared",59552);
    imageFontMap.put("icon-git",59553);
    imageFontMap.put("icon-github",59554);
    imageFontMap.put("icon-github-squared",59555);
    imageFontMap.put("icon-github-circled",59556);
    imageFontMap.put("icon-gittip",59557);
    imageFontMap.put("icon-google",59558);
    imageFontMap.put("icon-gplus",59559);
    imageFontMap.put("icon-gplus-squared",59560);
    imageFontMap.put("icon-hacker-news",59561);
    imageFontMap.put("icon-html5",59562);
    imageFontMap.put("icon-instagramm",59563);
    imageFontMap.put("icon-joomla",59564);
    imageFontMap.put("icon-jsfiddle",59565);
    imageFontMap.put("icon-linkedin-squared",59566);
    imageFontMap.put("icon-linux",59567);
    imageFontMap.put("icon-linkedin",59568);
    imageFontMap.put("icon-maxcdn",59569);
    imageFontMap.put("icon-openid",59570);
    imageFontMap.put("icon-pagelines",59571);
    imageFontMap.put("icon-pied-piper-squared",59572);
    imageFontMap.put("icon-pied-piper-alt",59573);
    imageFontMap.put("icon-pinterest-circled",59574);
    imageFontMap.put("icon-pinterest-squared",59575);
    imageFontMap.put("icon-qq",59576);
    imageFontMap.put("icon-reddit",59577);
    imageFontMap.put("icon-reddit-squared",59578);
    imageFontMap.put("icon-renren",59579);
    imageFontMap.put("icon-skype",59580);
    imageFontMap.put("icon-slack",59581);
    imageFontMap.put("icon-soundclowd",59582);
    imageFontMap.put("icon-spotify",59583);
    imageFontMap.put("icon-stackexchange",59584);
    imageFontMap.put("icon-stackoverflow",59585);
    imageFontMap.put("icon-steam",59586);
    imageFontMap.put("icon-steam-squared",59587);
    imageFontMap.put("icon-stumbleupon",59588);
    imageFontMap.put("icon-stumbleupon-circled",59589);
    imageFontMap.put("icon-tencent-weibo",59590);
    imageFontMap.put("icon-trello",59591);
    imageFontMap.put("icon-tumblr",59592);
    imageFontMap.put("icon-tumblr-squared",59593);
    imageFontMap.put("icon-twitter-squared",59594);
    imageFontMap.put("icon-twitter",59595);
    imageFontMap.put("icon-vimeo-squared",59596);
    imageFontMap.put("icon-vine",59597);
    imageFontMap.put("icon-vkontakte",59598);
    imageFontMap.put("icon-wechat",59599);
    imageFontMap.put("icon-weibo",59600);
    imageFontMap.put("icon-windows",59601);
    imageFontMap.put("icon-wordpress",59602);
    imageFontMap.put("icon-xing",59603);
    imageFontMap.put("icon-xing-squared",59604);
    imageFontMap.put("icon-youtube",59605);
    imageFontMap.put("icon-yahoo",59606);
    imageFontMap.put("icon-youtube-squared",59607);
    imageFontMap.put("icon-youtube-play",59608);
    imageFontMap.put("icon-blank",59609);
    imageFontMap.put("icon-lemon",59610);
    imageFontMap.put("icon-glass",59611);
    imageFontMap.put("icon-music",59612);
    imageFontMap.put("icon-search",59613);
    imageFontMap.put("icon-mail",59614);
    imageFontMap.put("icon-mail-alt",59615);
    imageFontMap.put("icon-mail-squared",59616);
    imageFontMap.put("icon-heart",59617);
    imageFontMap.put("icon-heart-empty",59618);
    imageFontMap.put("icon-star",59619);
    imageFontMap.put("icon-star-empty",59620);
    imageFontMap.put("icon-star-half",59621);
    imageFontMap.put("icon-star-half-alt",59622);
    imageFontMap.put("icon-user",59623);
    imageFontMap.put("icon-users",59624);
    imageFontMap.put("icon-male",59625);
    imageFontMap.put("icon-female",59626);
    imageFontMap.put("icon-child",59627);
    imageFontMap.put("icon-video",59628);
    imageFontMap.put("icon-videocam",59629);
    imageFontMap.put("icon-picture",59630);
    imageFontMap.put("icon-camera",59631);
    imageFontMap.put("icon-camera-alt",59632);
    imageFontMap.put("icon-th-large",59633);
    imageFontMap.put("icon-th",59634);
    imageFontMap.put("icon-th-list",59635);
    imageFontMap.put("icon-ok",59636);
    imageFontMap.put("icon-ok-circled",59637);
    imageFontMap.put("icon-ok-circled2",59638);
    imageFontMap.put("icon-ok-squared",59639);
    imageFontMap.put("icon-cancel",59640);
    imageFontMap.put("icon-cancel-circled",59641);
    imageFontMap.put("icon-cancel-circled2",59642);
    imageFontMap.put("icon-plus",59643);
    imageFontMap.put("icon-plus-circled",59644);
    imageFontMap.put("icon-plus-squared",59645);
    imageFontMap.put("icon-plus-squared-alt",59646);
    imageFontMap.put("icon-minus",59647);
    imageFontMap.put("icon-minus-circled",59648);
    imageFontMap.put("icon-minus-squared",59649);
    imageFontMap.put("icon-minus-squared-alt",59650);
    imageFontMap.put("icon-help",59651);
    imageFontMap.put("icon-help-circled",59652);
    imageFontMap.put("icon-info-circled",59653);
    imageFontMap.put("icon-info",59654);
    imageFontMap.put("icon-home",59655);
    imageFontMap.put("icon-link",59656);
    imageFontMap.put("icon-unlink",59657);
    imageFontMap.put("icon-link-ext",59658);
    imageFontMap.put("icon-link-ext-alt",59659);
    imageFontMap.put("icon-attach",59660);
    imageFontMap.put("icon-lock",59661);
    imageFontMap.put("icon-lock-open",59662);
    imageFontMap.put("icon-lock-open-alt",59663);
    imageFontMap.put("icon-pin",59664);
    imageFontMap.put("icon-eye",59665);
    imageFontMap.put("icon-eye-off",59666);
    imageFontMap.put("icon-tag",59667);
    imageFontMap.put("icon-tags",59668);
    imageFontMap.put("icon-bookmark",59669);
    imageFontMap.put("icon-bookmark-empty",59670);
    imageFontMap.put("icon-flag",59671);
    imageFontMap.put("icon-flag-empty",59672);
    imageFontMap.put("icon-flag-checkered",59673);
    imageFontMap.put("icon-thumbs-up",59674);
    imageFontMap.put("icon-thumbs-down",59675);
    imageFontMap.put("icon-thumbs-up-alt",59676);
    imageFontMap.put("icon-thumbs-down-alt",59677);
    imageFontMap.put("icon-download",59678);
    imageFontMap.put("icon-upload",59679);
    imageFontMap.put("icon-download-cloud",59680);
    imageFontMap.put("icon-upload-cloud",59681);
    imageFontMap.put("icon-reply",59682);
    imageFontMap.put("icon-reply-all",59683);
    imageFontMap.put("icon-forward",59684);
    imageFontMap.put("icon-quote-left",59685);
    imageFontMap.put("icon-quote-right",59686);
    imageFontMap.put("icon-code",59687);
    imageFontMap.put("icon-export",59688);
    imageFontMap.put("icon-export-alt",59689);
    imageFontMap.put("icon-share",59690);
    imageFontMap.put("icon-share-squared",59691);
    imageFontMap.put("icon-pencil",59692);
    imageFontMap.put("icon-pencil-squared",59693);
    imageFontMap.put("icon-edit",59694);
    imageFontMap.put("icon-print",59695);
    imageFontMap.put("icon-retweet",59696);
    imageFontMap.put("icon-keyboard",59697);
    imageFontMap.put("icon-gamepad",59698);
    imageFontMap.put("icon-comment",59699);
    imageFontMap.put("icon-chat",59700);
    imageFontMap.put("icon-comment-empty",59701);
    imageFontMap.put("icon-chat-empty",59702);
    imageFontMap.put("icon-bell",59703);
    imageFontMap.put("icon-bell-alt",59704);
    imageFontMap.put("icon-attention-alt",59705);
    imageFontMap.put("icon-attention",59706);
    imageFontMap.put("icon-attention-circled",59707);
    imageFontMap.put("icon-location",59708);
    imageFontMap.put("icon-direction",59709);
    imageFontMap.put("icon-compass",59710);
    imageFontMap.put("icon-trash",59711);
    imageFontMap.put("icon-doc",59712);
    imageFontMap.put("icon-docs",59713);
    imageFontMap.put("icon-doc-text",59714);
    imageFontMap.put("icon-doc-inv",59715);
    imageFontMap.put("icon-doc-text-inv",59716);
    imageFontMap.put("icon-file-pdf",59717);
    imageFontMap.put("icon-file-word",59718);
    imageFontMap.put("icon-file-excel",59719);
    imageFontMap.put("icon-file-powerpoint",59720);
    imageFontMap.put("icon-file-image",59721);
    imageFontMap.put("icon-file-archive",59722);
    imageFontMap.put("icon-file-audio",59723);
    imageFontMap.put("icon-file-video",59724);
    imageFontMap.put("icon-file-code",59725);
    imageFontMap.put("icon-folder",59726);
    imageFontMap.put("icon-folder-open",59727);
    imageFontMap.put("icon-folder-empty",59728);
    imageFontMap.put("icon-folder-open-empty",59729);
    imageFontMap.put("icon-box",59730);
    imageFontMap.put("icon-rss",59731);
    imageFontMap.put("icon-rss-squared",59732);
    imageFontMap.put("icon-phone",59733);
    imageFontMap.put("icon-phone-squared",59734);
    imageFontMap.put("icon-fax",59735);
    imageFontMap.put("icon-menu",59736);
    imageFontMap.put("icon-cog",59737);
    imageFontMap.put("icon-cog-alt",59738);
    imageFontMap.put("icon-wrench",59739);
    imageFontMap.put("icon-sliders",59740);
    imageFontMap.put("icon-basket",59741);
    imageFontMap.put("icon-calendar",59742);
    imageFontMap.put("icon-calendar-empty",59743);
    imageFontMap.put("icon-login",59744);
    imageFontMap.put("icon-logout",59745);
    imageFontMap.put("icon-mic",59746);
    imageFontMap.put("icon-mute",59747);
    imageFontMap.put("icon-volume-off",59748);
    imageFontMap.put("icon-volume-down",59749);
    imageFontMap.put("icon-volume-up",59750);
    imageFontMap.put("icon-headphones",59751);
    imageFontMap.put("icon-clock",59752);
    imageFontMap.put("icon-lightbulb",59753);
    imageFontMap.put("icon-block",59754);
    imageFontMap.put("icon-resize-full",59755);
    imageFontMap.put("icon-resize-full-alt",59756);
    imageFontMap.put("icon-resize-small",59757);
    imageFontMap.put("icon-resize-vertical",59758);
    imageFontMap.put("icon-resize-horizontal",59759);
    imageFontMap.put("icon-move",59760);
    imageFontMap.put("icon-zoom-in",59761);
    imageFontMap.put("icon-zoom-out",59762);
    imageFontMap.put("icon-down-circled2",59763);
    imageFontMap.put("icon-up-circled2",59764);
    imageFontMap.put("icon-left-circled2",59765);
    imageFontMap.put("icon-right-circled2",59766);
    imageFontMap.put("icon-down-dir",59767);
    imageFontMap.put("icon-up-dir",59768);
    imageFontMap.put("icon-left-dir",59769);
    imageFontMap.put("icon-right-dir",59770);
    imageFontMap.put("icon-down-open",59771);
    imageFontMap.put("icon-left-open",59772);
    imageFontMap.put("icon-right-open",59773);
    imageFontMap.put("icon-up-open",59774);
    imageFontMap.put("icon-angle-left",59775);
    imageFontMap.put("icon-angle-right",59776);
    imageFontMap.put("icon-angle-up",59777);
    imageFontMap.put("icon-angle-down",59778);
    imageFontMap.put("icon-angle-circled-left",59779);
    imageFontMap.put("icon-angle-circled-right",59780);
    imageFontMap.put("icon-angle-circled-up",59781);
    imageFontMap.put("icon-angle-circled-down",59782);
    imageFontMap.put("icon-angle-double-left",59783);
    imageFontMap.put("icon-angle-double-right",59784);
    imageFontMap.put("icon-angle-double-up",59785);
    imageFontMap.put("icon-angle-double-down",59786);
    imageFontMap.put("icon-down",59787);
    imageFontMap.put("icon-left",59788);
    imageFontMap.put("icon-right",59789);
    imageFontMap.put("icon-up",59790);
    imageFontMap.put("icon-down-big",59791);
    imageFontMap.put("icon-left-big",59792);
    imageFontMap.put("icon-right-big",59793);
    imageFontMap.put("icon-up-big",59794);
    imageFontMap.put("icon-right-hand",59795);
    imageFontMap.put("icon-left-hand",59796);
    imageFontMap.put("icon-up-hand",59797);
    imageFontMap.put("icon-down-hand",59798);
    imageFontMap.put("icon-left-circled",59799);
    imageFontMap.put("icon-right-circled",59800);
    imageFontMap.put("icon-up-circled",59801);
    imageFontMap.put("icon-down-circled",59802);
    imageFontMap.put("icon-cw",59803);
    imageFontMap.put("icon-ccw",59804);
    imageFontMap.put("icon-arrows-cw",59805);
    imageFontMap.put("icon-level-up",59806);
    imageFontMap.put("icon-level-down",59807);
    imageFontMap.put("icon-shuffle",59808);
    imageFontMap.put("icon-exchange",59809);
    imageFontMap.put("icon-history",59810);
    imageFontMap.put("icon-expand",59811);
    imageFontMap.put("icon-collapse",59812);
    imageFontMap.put("icon-expand-right",59813);
    imageFontMap.put("icon-collapse-left",59814);
    imageFontMap.put("icon-play",59815);
    imageFontMap.put("icon-play-circled",59816);
    imageFontMap.put("icon-play-circled2",59817);
    imageFontMap.put("icon-stop",59818);
    imageFontMap.put("icon-pause",59819);
    imageFontMap.put("icon-to-end",59820);
    imageFontMap.put("icon-to-end-alt",59821);
    imageFontMap.put("icon-to-start",59822);
    imageFontMap.put("icon-to-start-alt",59823);
    imageFontMap.put("icon-fast-fw",59824);
    imageFontMap.put("icon-fast-bw",59825);
    imageFontMap.put("icon-eject",59826);
    imageFontMap.put("icon-target",59827);
    imageFontMap.put("icon-signal",59828);
    imageFontMap.put("icon-award",59829);
    imageFontMap.put("icon-desktop",59830);
    imageFontMap.put("icon-music-outline",59831);
    imageFontMap.put("icon-music-1",59832);
    imageFontMap.put("icon-search-outline",59833);
    imageFontMap.put("icon-search-1",59834);
    imageFontMap.put("icon-mail-1",59835);
    imageFontMap.put("icon-heart-1",59836);
    imageFontMap.put("icon-heart-filled",59837);
    imageFontMap.put("icon-star-1",59838);
    imageFontMap.put("icon-star-filled",59839);
    imageFontMap.put("icon-user-outline",59840);
    imageFontMap.put("icon-user-1",59841);
    imageFontMap.put("icon-users-outline",59842);
    imageFontMap.put("icon-users-1",59843);
    imageFontMap.put("icon-user-add-outline",59844);
    imageFontMap.put("icon-user-add",59845);
    imageFontMap.put("icon-user-delete-outline",59846);
    imageFontMap.put("icon-user-delete",59847);
    imageFontMap.put("icon-video-1",59848);
    imageFontMap.put("icon-videocam-outline",59849);
    imageFontMap.put("icon-videocam-1",59850);
    imageFontMap.put("icon-picture-outline",59851);
    imageFontMap.put("icon-picture-1",59852);
    imageFontMap.put("icon-camera-outline",59853);
    imageFontMap.put("icon-camera-1",59854);
    imageFontMap.put("icon-th-outline",59855);
    imageFontMap.put("icon-th-1",59856);
    imageFontMap.put("icon-th-large-outline",59857);
    imageFontMap.put("icon-th-large-1",59858);
    imageFontMap.put("icon-th-list-outline",59859);
    imageFontMap.put("icon-th-list-1",59860);
    imageFontMap.put("icon-ok-outline",59861);
    imageFontMap.put("icon-ok-1",59862);
    imageFontMap.put("icon-cancel-outline",59863);
    imageFontMap.put("icon-cancel-1",59864);
    imageFontMap.put("icon-cancel-alt",59865);
    imageFontMap.put("icon-cancel-alt-filled",59866);
    imageFontMap.put("icon-cancel-circled-outline",59867);
    imageFontMap.put("icon-cancel-circled-1",59868);
    imageFontMap.put("icon-plus-outline",59869);
    imageFontMap.put("icon-plus-1",59870);
    imageFontMap.put("icon-minus-outline",59871);
    imageFontMap.put("icon-minus-1",59872);
    imageFontMap.put("icon-divide-outline",59873);
    imageFontMap.put("icon-divide",59874);
    imageFontMap.put("icon-eq-outline",59875);
    imageFontMap.put("icon-eq",59876);
    imageFontMap.put("icon-info-outline",59877);
    imageFontMap.put("icon-info-1",59878);
    imageFontMap.put("icon-home-outline",59879);
    imageFontMap.put("icon-home-1",59880);
    imageFontMap.put("icon-link-outline",59881);
    imageFontMap.put("icon-link-1",59882);
    imageFontMap.put("icon-attach-outline",59883);
    imageFontMap.put("icon-attach-1",59884);
    imageFontMap.put("icon-lock-1",59885);
    imageFontMap.put("icon-lock-filled",59886);
    imageFontMap.put("icon-lock-open-1",59887);
    imageFontMap.put("icon-lock-open-filled",59888);
    imageFontMap.put("icon-pin-outline",59889);
    imageFontMap.put("icon-pin-1",59890);
    imageFontMap.put("icon-eye-outline",59891);
    imageFontMap.put("icon-eye-1",59892);
    imageFontMap.put("icon-tag-1",59893);
    imageFontMap.put("icon-tags-1",59894);
    imageFontMap.put("icon-bookmark-1",59895);
    imageFontMap.put("icon-flag-1",59896);
    imageFontMap.put("icon-flag-filled",59897);
    imageFontMap.put("icon-thumbs-up-1",59898);
    imageFontMap.put("icon-thumbs-down-1",59899);
    imageFontMap.put("icon-download-outline",59900);
    imageFontMap.put("icon-download-1",59901);
    imageFontMap.put("icon-upload-outline",59902);
    imageFontMap.put("icon-upload-1",59903);
    imageFontMap.put("icon-upload-cloud-outline",59904);
    imageFontMap.put("icon-upload-cloud-1",59905);
    imageFontMap.put("icon-reply-outline",59906);
    imageFontMap.put("icon-reply-1",59907);
    imageFontMap.put("icon-forward-outline",59908);
    imageFontMap.put("icon-forward-1",59909);
    imageFontMap.put("icon-code-outline",59910);
    imageFontMap.put("icon-code-1",59911);
    imageFontMap.put("icon-export-outline",59912);
    imageFontMap.put("icon-export-1",59913);
    imageFontMap.put("icon-pencil-1",59914);
    imageFontMap.put("icon-pen",59915);
    imageFontMap.put("icon-feather",59916);
    imageFontMap.put("icon-edit-1",59917);
    imageFontMap.put("icon-print-1",59918);
    imageFontMap.put("icon-comment-1",59919);
    imageFontMap.put("icon-chat-1",59920);
    imageFontMap.put("icon-chat-alt",59921);
    imageFontMap.put("icon-bell-1",59922);
    imageFontMap.put("icon-attention-1",59923);
    imageFontMap.put("icon-attention-filled",59924);
    imageFontMap.put("icon-warning-empty",59925);
    imageFontMap.put("icon-warning",59926);
    imageFontMap.put("icon-contacts",59927);
    imageFontMap.put("icon-vcard",59928);
    imageFontMap.put("icon-address",59929);
    imageFontMap.put("icon-location-outline",59930);
    imageFontMap.put("icon-location-1",59931);
    imageFontMap.put("icon-map",59932);
    imageFontMap.put("icon-direction-outline",59933);
    imageFontMap.put("icon-direction-1",59934);
    imageFontMap.put("icon-compass-1",59935);
    imageFontMap.put("icon-trash-1",59936);
    imageFontMap.put("icon-doc-1",59937);
    imageFontMap.put("icon-doc-text-1",59938);
    imageFontMap.put("icon-doc-add",59939);
    imageFontMap.put("icon-doc-remove",59940);
    imageFontMap.put("icon-news",59941);
    imageFontMap.put("icon-folder-1",59942);
    imageFontMap.put("icon-folder-add",59943);
    imageFontMap.put("icon-folder-delete",59944);
    imageFontMap.put("icon-archive",59945);
    imageFontMap.put("icon-box-1",59946);
    imageFontMap.put("icon-rss-outline",59947);
    imageFontMap.put("icon-rss-1",59948);
    imageFontMap.put("icon-phone-outline",59949);
    imageFontMap.put("icon-phone-1",59950);
    imageFontMap.put("icon-menu-outline",59951);
    imageFontMap.put("icon-menu-1",59952);
    imageFontMap.put("icon-cog-outline",59953);
    imageFontMap.put("icon-cog-1",59954);
    imageFontMap.put("icon-wrench-outline",59955);
    imageFontMap.put("icon-wrench-1",59956);
    imageFontMap.put("icon-basket-1",59957);
    imageFontMap.put("icon-calendar-outlilne",59958);
    imageFontMap.put("icon-calendar-1",59959);
    imageFontMap.put("icon-mic-outline",59960);
    imageFontMap.put("icon-mic-1",59961);
    imageFontMap.put("icon-volume-off-1",59962);
    imageFontMap.put("icon-volume-low",59963);
    imageFontMap.put("icon-volume-middle",59964);
    imageFontMap.put("icon-volume-high",59965);
    imageFontMap.put("icon-headphones-1",59966);
    imageFontMap.put("icon-clock-1",59967);
    imageFontMap.put("icon-wristwatch",59968);
    imageFontMap.put("icon-stopwatch",59969);
    imageFontMap.put("icon-lightbulb-1",59970);
    imageFontMap.put("icon-block-outline",59971);
    imageFontMap.put("icon-block-1",59972);
    imageFontMap.put("icon-resize-full-outline",59973);
    imageFontMap.put("icon-resize-full-1",59974);
    imageFontMap.put("icon-resize-normal-outline",59975);
    imageFontMap.put("icon-resize-normal",59976);
    imageFontMap.put("icon-move-outline",59977);
    imageFontMap.put("icon-move-1",59978);
    imageFontMap.put("icon-popup",59979);
    imageFontMap.put("icon-zoom-in-outline",59980);
    imageFontMap.put("icon-zoom-in-1",59981);
    imageFontMap.put("icon-zoom-out-outline",59982);
    imageFontMap.put("icon-zoom-out-1",59983);
    imageFontMap.put("icon-popup-1",59984);
    imageFontMap.put("icon-left-open-outline",59985);
    imageFontMap.put("icon-left-open-1",59986);
    imageFontMap.put("icon-right-open-outline",59987);
    imageFontMap.put("icon-right-open-1",59988);
    imageFontMap.put("icon-down-1",59989);
    imageFontMap.put("icon-left-1",59990);
    imageFontMap.put("icon-right-1",59991);
    imageFontMap.put("icon-up-1",59992);
    imageFontMap.put("icon-down-outline",59993);
    imageFontMap.put("icon-left-outline",59994);
    imageFontMap.put("icon-right-outline",59995);
    imageFontMap.put("icon-up-outline",59996);
    imageFontMap.put("icon-down-small",59997);
    imageFontMap.put("icon-left-small",59998);
    imageFontMap.put("icon-right-small",59999);
    imageFontMap.put("icon-up-small",60000);
    imageFontMap.put("icon-cw-outline",60001);
    imageFontMap.put("icon-cw-1",60002);
    imageFontMap.put("icon-arrows-cw-outline",60003);
    imageFontMap.put("icon-arrows-cw-1",60004);
    imageFontMap.put("icon-loop-outline",60005);
    imageFontMap.put("icon-loop",60006);
    imageFontMap.put("icon-loop-alt-outline",60007);
    imageFontMap.put("icon-loop-alt",60008);
    imageFontMap.put("icon-shuffle-1",60009);
    imageFontMap.put("icon-play-outline",60010);
    imageFontMap.put("icon-play-1",60011);
    imageFontMap.put("icon-stop-outline",60012);
    imageFontMap.put("icon-stop-1",60013);
    imageFontMap.put("icon-pause-outline",60014);
    imageFontMap.put("icon-pause-1",60015);
    imageFontMap.put("icon-fast-fw-outline",60016);
    imageFontMap.put("icon-fast-fw-1",60017);
    imageFontMap.put("icon-rewind-outline",60018);
    imageFontMap.put("icon-rewind",60019);
    imageFontMap.put("icon-record-outline",60020);
    imageFontMap.put("icon-record",60021);
    imageFontMap.put("icon-eject-outline",60022);
    imageFontMap.put("icon-eject-1",60023);
    imageFontMap.put("icon-eject-alt-outline",60024);
    imageFontMap.put("icon-eject-alt",60025);
    imageFontMap.put("icon-bat1",60026);
    imageFontMap.put("icon-bat2",60027);
    imageFontMap.put("icon-bat3",60028);
    imageFontMap.put("icon-bat4",60029);
    imageFontMap.put("icon-bat-charge",60030);
    imageFontMap.put("icon-plug",60031);
    imageFontMap.put("icon-target-outline",60032);
    imageFontMap.put("icon-target-1",60033);
    imageFontMap.put("icon-wifi-outline",60034);
    imageFontMap.put("icon-wifi",60035);
    imageFontMap.put("icon-desktop-1",60036);
    imageFontMap.put("icon-laptop-1",60037);
    imageFontMap.put("icon-tablet-1",60038);
    imageFontMap.put("icon-mobile-1",60039);
    imageFontMap.put("icon-contrast",60040);
    imageFontMap.put("icon-globe-outline",60041);
    imageFontMap.put("icon-globe-1",60042);
    imageFontMap.put("icon-globe-alt-outline",60043);
    imageFontMap.put("icon-globe-alt",60044);
    imageFontMap.put("icon-sun-1",60045);
    imageFontMap.put("icon-sun-filled",60046);
    imageFontMap.put("icon-cloud-1",60047);
    imageFontMap.put("icon-flash-outline",60048);
    imageFontMap.put("icon-flash-1",60049);
    imageFontMap.put("icon-moon-1",60050);
    imageFontMap.put("icon-waves-outline",60051);
    imageFontMap.put("icon-waves",60052);
    imageFontMap.put("icon-rain",60053);
    imageFontMap.put("icon-cloud-sun",60054);
    imageFontMap.put("icon-drizzle",60055);
    imageFontMap.put("icon-snow",60056);
    imageFontMap.put("icon-cloud-flash",60057);
    imageFontMap.put("icon-cloud-wind",60058);
    imageFontMap.put("icon-wind",60059);
    imageFontMap.put("icon-plane-outline",60060);
    imageFontMap.put("icon-plane",60061);
    imageFontMap.put("icon-leaf-1",60062);
    imageFontMap.put("icon-lifebuoy-1",60063);
    imageFontMap.put("icon-briefcase-1",60064);
    imageFontMap.put("icon-brush",60065);
    imageFontMap.put("icon-pipette",60066);
    imageFontMap.put("icon-power-outline",60067);
    imageFontMap.put("icon-power",60068);
    imageFontMap.put("icon-check-outline",60069);
    imageFontMap.put("icon-check-1",60070);
    imageFontMap.put("icon-gift-1",60071);
    imageFontMap.put("icon-temperatire",60072);
    imageFontMap.put("icon-chart-outline",60073);
    imageFontMap.put("icon-chart",60074);
    imageFontMap.put("icon-chart-alt-outline",60075);
    imageFontMap.put("icon-chart-alt",60076);
    imageFontMap.put("icon-chart-bar-outline",60077);
    imageFontMap.put("icon-chart-bar-1",60078);
    imageFontMap.put("icon-chart-pie-outline",60079);
    imageFontMap.put("icon-chart-pie",60080);
    imageFontMap.put("icon-ticket-1",60081);
    imageFontMap.put("icon-credit-card-1",60082);
    imageFontMap.put("icon-clipboard",60083);
    imageFontMap.put("icon-database-1",60084);
    imageFontMap.put("icon-key-outline",60085);
    imageFontMap.put("icon-key-1",60086);
    imageFontMap.put("icon-flow-split",60087);
    imageFontMap.put("icon-flow-merge",60088);
    imageFontMap.put("icon-flow-parallel",60089);
    imageFontMap.put("icon-flow-cross",60090);
    imageFontMap.put("icon-certificate-outline",60091);
    imageFontMap.put("icon-certificate-1",60092);
    imageFontMap.put("icon-scissors-outline",60093);
    imageFontMap.put("icon-scissors-1",60094);
    imageFontMap.put("icon-flask",60095);
    imageFontMap.put("icon-wine",60096);
    imageFontMap.put("icon-coffee-1",60097);
    imageFontMap.put("icon-beer-1",60098);
    imageFontMap.put("icon-anchor-outline",60099);
    imageFontMap.put("icon-anchor-1",60100);
    imageFontMap.put("icon-puzzle-outline",60101);
    imageFontMap.put("icon-puzzle-1",60102);
    imageFontMap.put("icon-tree-1",60103);
    imageFontMap.put("icon-calculator",60104);
    imageFontMap.put("icon-infinity-outline",60105);
    imageFontMap.put("icon-infinity",60106);
    imageFontMap.put("icon-pi-outline",60107);
    imageFontMap.put("icon-pi",60108);
    imageFontMap.put("icon-at",60109);
    imageFontMap.put("icon-at-circled",60110);
    imageFontMap.put("icon-looped-square-outline",60111);
    imageFontMap.put("icon-looped-square-interest",60112);
    imageFontMap.put("icon-sort-alphabet-outline",60113);
    imageFontMap.put("icon-sort-alphabet",60114);
    imageFontMap.put("icon-sort-numeric-outline",60115);
    imageFontMap.put("icon-sort-numeric",60116);
    imageFontMap.put("icon-dribbble-circled",60117);
    imageFontMap.put("icon-dribbble-1",60118);
    imageFontMap.put("icon-facebook-circled",60119);
    imageFontMap.put("icon-facebook-1",60120);
    imageFontMap.put("icon-flickr-circled",60121);
    imageFontMap.put("icon-flickr-1",60122);
    imageFontMap.put("icon-github-circled-1",60123);
    imageFontMap.put("icon-github-1",60124);
    imageFontMap.put("icon-lastfm-circled",60125);
    imageFontMap.put("icon-lastfm",60126);
    imageFontMap.put("icon-linkedin-circled",60127);
    imageFontMap.put("icon-linkedin-1",60128);
    imageFontMap.put("icon-pinterest-circled-1",60129);
    imageFontMap.put("icon-pinterest",60130);
    imageFontMap.put("icon-skype-outline",60131);
    imageFontMap.put("icon-skype-1",60132);
    imageFontMap.put("icon-tumbler-circled",60133);
    imageFontMap.put("icon-tumbler",60134);
    imageFontMap.put("icon-twitter-circled",60135);
    imageFontMap.put("icon-twitter-1",60136);
    imageFontMap.put("icon-vimeo-circled",60137);
    imageFontMap.put("icon-vimeo",60138);
    imageFontMap.put("icon-search-2",60139);
    imageFontMap.put("icon-mail-2",60140);
    imageFontMap.put("icon-heart-2",60141);
    imageFontMap.put("icon-heart-broken",60142);
    imageFontMap.put("icon-star-2",60143);
    imageFontMap.put("icon-star-empty-1",60144);
    imageFontMap.put("icon-star-half-1",60145);
    imageFontMap.put("icon-star-half_empty",60146);
    imageFontMap.put("icon-user-2",60147);
    imageFontMap.put("icon-user-male",60148);
    imageFontMap.put("icon-user-female",60149);
    imageFontMap.put("icon-users-2",60150);
    imageFontMap.put("icon-movie",60151);
    imageFontMap.put("icon-ok-2",60152);
    imageFontMap.put("icon-ok-circled-1",60153);
    imageFontMap.put("icon-cancel-2",60154);
    imageFontMap.put("icon-cancel-circled-2",60155);
    imageFontMap.put("icon-plus-2",60156);
    imageFontMap.put("icon-help-circled-1",60157);
    imageFontMap.put("icon-help-circled-alt",60158);
    imageFontMap.put("icon-info-circled-1",60159);
    imageFontMap.put("icon-info-circled-alt",60160);
    imageFontMap.put("icon-home-2",60161);
    imageFontMap.put("icon-link-2",60162);
    imageFontMap.put("icon-attach-2",60163);
    imageFontMap.put("icon-lock-2",60164);
    imageFontMap.put("icon-upload-cloud-2",60165);
    imageFontMap.put("icon-reply-2",60166);
    imageFontMap.put("icon-pencil-2",60167);
    imageFontMap.put("icon-export-2",60168);
    imageFontMap.put("icon-print-2",60169);
    imageFontMap.put("icon-retweet-1",60170);
    imageFontMap.put("icon-comment-2",60171);
    imageFontMap.put("icon-chat-2",60172);
    imageFontMap.put("icon-bell-2",60173);
    imageFontMap.put("icon-attention-2",60174);
    imageFontMap.put("icon-attention-alt-1",60175);
    imageFontMap.put("icon-location-2",60176);
    imageFontMap.put("icon-trash-2",60177);
    imageFontMap.put("icon-calendar-2",60178);
    imageFontMap.put("icon-login-1",60179);
    imageFontMap.put("icon-logout-1",60180);
    imageFontMap.put("icon-mic-2",60181);
    imageFontMap.put("icon-mic-off",60182);
    imageFontMap.put("icon-clock-2",60183);
    imageFontMap.put("icon-stopwatch-1",60184);
    imageFontMap.put("icon-hourglass",60185);
    imageFontMap.put("icon-zoom-in-2",60186);
    imageFontMap.put("icon-zoom-out-2",60187);
    imageFontMap.put("icon-down-open-1",60188);
    imageFontMap.put("icon-left-open-2",60189);
    imageFontMap.put("icon-right-open-2",60190);
    imageFontMap.put("icon-right-bold",60191);
    imageFontMap.put("icon-up-bold",60192);
    imageFontMap.put("icon-down-fat",60193);
    imageFontMap.put("icon-left-fat",60194);
    imageFontMap.put("icon-right-fat",60195);
    imageFontMap.put("icon-up-fat",60196);
    imageFontMap.put("icon-ccw-1",60197);
    imageFontMap.put("icon-shuffle-2",60198);
    imageFontMap.put("icon-play-2",60199);
    imageFontMap.put("icon-pause-2",60200);
    imageFontMap.put("icon-stop-2",60201);
    imageFontMap.put("icon-to-end-1",60202);
    imageFontMap.put("icon-to-start-1",60203);
    imageFontMap.put("icon-data-science-inv",60204);
    imageFontMap.put("icon-inbox-1",60205);
    imageFontMap.put("icon-globe-2",60206);
    imageFontMap.put("icon-globe-inv",60207);
    imageFontMap.put("icon-flash-2",60208);
    imageFontMap.put("icon-cloud-2",60209);
    imageFontMap.put("icon-coverflow",60210);
    imageFontMap.put("icon-coverflow-empty",60211);
    imageFontMap.put("icon-math",60212);
    imageFontMap.put("icon-math-circled",60213);
    imageFontMap.put("icon-math-circled-empty",60214);
    imageFontMap.put("icon-paper-plane-1",60215);
    imageFontMap.put("icon-paper-plane-alt",60216);
    imageFontMap.put("icon-ruler",60217);
    imageFontMap.put("icon-vector",60218);
    imageFontMap.put("icon-vector-pencil",60219);
    imageFontMap.put("icon-at-1",60220);
    imageFontMap.put("icon-hash",60221);
    imageFontMap.put("icon-female-1",60222);
    imageFontMap.put("icon-male-1",60223);
    imageFontMap.put("icon-spread",60224);
    imageFontMap.put("icon-king",60225);
    imageFontMap.put("icon-anchor-2",60226);
    imageFontMap.put("icon-joystick",60227);
    imageFontMap.put("icon-spinner1",60228);
    imageFontMap.put("icon-spinner2",60229);
    imageFontMap.put("icon-videocam-2",60230);
    imageFontMap.put("icon-isight",60231);
    imageFontMap.put("icon-camera-2",60232);
    imageFontMap.put("icon-menu-2",60233);
    imageFontMap.put("icon-th-thumb",60234);
    imageFontMap.put("icon-th-thumb-empty",60235);
    imageFontMap.put("icon-th-list-2",60236);
    imageFontMap.put("icon-lock-alt",60237);
    imageFontMap.put("icon-lock-open-2",60238);
    imageFontMap.put("icon-lock-open-alt-1",60239);
    imageFontMap.put("icon-eye-2",60240);
    imageFontMap.put("icon-download-2",60241);
    imageFontMap.put("icon-upload-2",60242);
    imageFontMap.put("icon-download-cloud-1",60243);
    imageFontMap.put("icon-doc-2",60244);
    imageFontMap.put("icon-newspaper",60245);
    imageFontMap.put("icon-folder-2",60246);
    imageFontMap.put("icon-folder-open-1",60247);
    imageFontMap.put("icon-folder-empty-1",60248);
    imageFontMap.put("icon-folder-open-empty-1",60249);
    imageFontMap.put("icon-cog-2",60250);
    imageFontMap.put("icon-up-open-1",60251);
    imageFontMap.put("icon-down-2",60252);
    imageFontMap.put("icon-left-2",60253);
    imageFontMap.put("icon-right-2",60254);
    imageFontMap.put("icon-up-2",60255);
    imageFontMap.put("icon-down-bold",60256);
    imageFontMap.put("icon-left-bold",60257);
    imageFontMap.put("icon-fast-forward",60258);
    imageFontMap.put("icon-fast-backward",60259);
    imageFontMap.put("icon-trophy",60260);
    imageFontMap.put("icon-monitor",60261);
    imageFontMap.put("icon-tablet-2",60262);
    imageFontMap.put("icon-mobile-2",60263);
    imageFontMap.put("icon-data-science",60264);
    imageFontMap.put("icon-paper-plane-alt2",60265);
    imageFontMap.put("icon-fontsize",60266);
    imageFontMap.put("icon-color-adjust",60267);
    imageFontMap.put("icon-fire-1",60268);
    imageFontMap.put("icon-chart-bar-2",60269);
    imageFontMap.put("icon-hdd-1",60270);
    imageFontMap.put("icon-connected-object",60271);
    imageFontMap.put("icon-windy-rain-inv",60272);
    imageFontMap.put("icon-snow-inv",60273);
    imageFontMap.put("icon-snow-heavy-inv",60274);
    imageFontMap.put("icon-hail-inv",60275);
    imageFontMap.put("icon-clouds-inv",60276);
    imageFontMap.put("icon-clouds-flash-inv",60277);
    imageFontMap.put("icon-temperature",60278);
    imageFontMap.put("icon-compass-2",60279);
    imageFontMap.put("icon-na",60280);
    imageFontMap.put("icon-celcius",60281);
    imageFontMap.put("icon-fahrenheit",60282);
    imageFontMap.put("icon-clouds-flash-alt",60283);
    imageFontMap.put("icon-sun-inv",60284);
    imageFontMap.put("icon-moon-inv",60285);
    imageFontMap.put("icon-cloud-sun-inv",60286);
    imageFontMap.put("icon-cloud-moon-inv",60287);
    imageFontMap.put("icon-cloud-inv",60288);
    imageFontMap.put("icon-cloud-flash-inv",60289);
    imageFontMap.put("icon-drizzle-inv",60290);
    imageFontMap.put("icon-rain-inv",60291);
    imageFontMap.put("icon-windy-inv",60292);
    imageFontMap.put("icon-sunrise",60293);
    imageFontMap.put("icon-sun-2",60294);
    imageFontMap.put("icon-moon-2",60295);
    imageFontMap.put("icon-eclipse",60296);
    imageFontMap.put("icon-mist",60297);
    imageFontMap.put("icon-wind-1",60298);
    imageFontMap.put("icon-snowflake",60299);
    imageFontMap.put("icon-cloud-sun-1",60300);
    imageFontMap.put("icon-cloud-moon",60301);
    imageFontMap.put("icon-fog-sun",60302);
    imageFontMap.put("icon-fog-moon",60303);
    imageFontMap.put("icon-fog-cloud",60304);
    imageFontMap.put("icon-fog",60305);
    imageFontMap.put("icon-cloud-3",60306);
    imageFontMap.put("icon-cloud-flash-1",60307);
    imageFontMap.put("icon-cloud-flash-alt",60308);
    imageFontMap.put("icon-drizzle-1",60309);
    imageFontMap.put("icon-rain-1",60310);
    imageFontMap.put("icon-windy",60311);
    imageFontMap.put("icon-windy-rain",60312);
    imageFontMap.put("icon-snow-1",60313);
    imageFontMap.put("icon-snow-alt",60314);
    imageFontMap.put("icon-snow-heavy",60315);
    imageFontMap.put("icon-hail",60316);
    imageFontMap.put("icon-clouds",60317);
    imageFontMap.put("icon-clouds-flash",60318);
}
%>

    
<%!
  public void addHTMLResource(Integer id, JSONObject htmlResources, List<Textbaustein> textbausteinListe) {
    try {
      String ximaId = "de.xima.fc.resource.html-" + String.valueOf(id);
      if (!htmlResources.has(ximaId)){
        for (Textbaustein textbaustein : textbausteinListe) {
          if (textbaustein.getId() == id) {
            JSONObject htmlResource = new JSONObject();
            htmlResource.put("id",ximaId);
            htmlResource.put("name",textbaustein.getName());
            htmlResource.put("html",textbaustein.getBeschreibung());
            htmlResources.put(ximaId,htmlResource);
            break;
          }
        }
      }
    }
    catch (Exception e) {
      e.printStackTrace();
    }
  }
    
  public void addXSLResource(Integer id, JSONObject xslResources, List<Textbaustein> textbausteinListe) {
    try {
      String ximaId = "de.xima.fc.resource.xsl-" + String.valueOf(id);
      if (!xslResources.has(ximaId)){
        for (Textbaustein textbaustein : textbausteinListe) {
          if (textbaustein.getId() == id) {
            JSONObject xslResource = new JSONObject();
            xslResource.put("id",ximaId);
            xslResource.put("name",textbaustein.getName());
            xslResource.put("xsl",textbaustein.getBeschreibung());
            xslResources.put(ximaId,xslResource);
            break;
          }
        }
      }
    }
    catch (Exception e) {
      e.printStackTrace();
    }
  }
    
  public JSONObject getImageIcon(String actionIcon, JSONObject imageFont, Map<String,Integer> imageFontMap, Map<String,String> imageFontValues) {
    JSONObject j = new JSONObject();

    try {
      String id;
      if (imageFontValues.containsKey(actionIcon)) {
        id = imageFontValues.get(actionIcon);
        j.put("id", id);
        j.put("codepoint", imageFontMap.get(actionIcon));
        j.put("color", JSONObject.NULL);
        j.put("font", "de.xima.fc.resource.font-0");
      }
      else {
        id = "de.xima.fc.resource.image.font-" + String.valueOf(imageFont.length());
        j.put("id", id);
        j.put("codepoint", imageFontMap.get(actionIcon));
        j.put("color", JSONObject.NULL);
        j.put("font", "de.xima.fc.resource.font-0");
        imageFontValues.put(actionIcon,id);
        imageFont.put(id,new JSONObject(j.toString()));
      }
    }
    catch (Exception e) {
      e.printStackTrace();
    }

    return j;
  }

  public JSONObject getCondJson(Bedingung cond, Locale locale) {
    JSONObject j = new JSONObject();
    JSONObject condDetails = new JSONObject();

    try {
      Aktion nextAction = cond.getFolgeAktion();

      j.put("details", condDetails);
      j.put("displayName", cond.getExecCondition().getDisplayName(locale));
      j.put("nextActionDisplayName",cond.getWeiterverarbeitung().getDisplayName(locale));    
      switch (cond.getExecCondition()) {
        case UNCONDITIONAL:
          j.put("type", "NONE");
          break;
        case REGEX_MATCH:
          j.put("type", "REGEXP");
          condDetails.put("regexp", cond.getRegex());
          switch (cond.getWeiterverarbeitung()) {
            case ABBRUCH:
              condDetails.put("nextAction", "STOP");
              break;
            case KONFIGURIERTE_FOLGEAKTION:
              condDetails.put("nextAction", "de.xima.fc.action-" + String.valueOf(nextAction.getId()));
              break;
            case NAECHSTE_AKTION:
              condDetails.put("nextAction", "NEXT");
              break;
          }
          break;
        case FORMVALUE_MATCH:
          j.put("type", "FORM");
          condDetails.put("displayNameConditionOperator", cond.getMatchCondition().getDisplayName(locale));
          if (cond.getMatchOperand() != null) {
            condDetails.put("hasRHS", true);
            condDetails.put("conditionRHS", cond.getMatchOperand());
          }
          else {
            condDetails.put("hasRHS", false);
            condDetails.put("conditionRHS", "");
          }
          if (cond.getFormFieldName() != null) {
            condDetails.put("conditionLHS", cond.getFormFieldName());
          }
          else {
            condDetails.put("conditionLHS", "");
          }
          switch (cond.getWeiterverarbeitung()) {
            case ABBRUCH:
              condDetails.put("nextAction", "STOP");
              break;
            case KONFIGURIERTE_FOLGEAKTION:
              condDetails.put("nextAction", "de.xima.fc.action-" + String.valueOf(nextAction.getId()));
              break;
            case NAECHSTE_AKTION:
              condDetails.put("nextAction", "NEXT");
              break;
          }
          switch (cond.getMatchCondition()) {
            case CONTAINS:
              condDetails.put("conditionOperator", "CONTAINS");
              break;
            case EMPTY:
              condDetails.put("conditionOperator", "EMPTY");
              break;
            case ENDS_WITH:
              condDetails.put("conditionOperator", "ENDSON");
              break;
            case EQUAL:
              condDetails.put("conditionOperator", "EQUAL");
              break;
            case GREATER:
              condDetails.put("conditionOperator", "GREATER");
              break;
            case LESSER:
              condDetails.put("conditionOperator", "SMALLER");
              break;
            case NOT_EMPTY:
              condDetails.put("conditionOperator", "NONEMPTY");
              break;
            case NOT_EQUAL:
              condDetails.put("conditionOperator", "NOTEQUAL");
              break;
            case REGEX_MATCH:
              condDetails.put("conditionOperator", "MATCHES");
              break;
            case STARTS_WITH:
              condDetails.put("conditionOperator", "STARTSWITH");
              break;
          }
          break;
      }
    }
    catch (Exception e) {
      e.printStackTrace();
    }

    return j;
  }

  public JSONArray getFileActionIds(List<Integer> filesIdList) {
    JSONArray filesJsonArray = new JSONArray();
    try {
      for (int i=0; i<filesIdList.size(); i++) {
        filesJsonArray.put("de.xima.fc.action-" + String.valueOf(filesIdList.get(i)));
      }
    }
    catch (Exception e) {
      e.printStackTrace();                                   
    }
    return filesJsonArray;
  }
    
  // Create action json object.
  public JSONObject getAktionJson(Aktion action, JSONObject imageFont, Status status, JSONArray transitionsJsonArray, Locale locale, Map<String,Integer> imageFontMap, Map<String,String> imageFontValues, JSONObject htmlJsonObject, JSONObject xslJsonObject, List<Textbaustein> textbausteinListe) {
    JSONObject j = new JSONObject();
    JSONObject PropJsonObject = new JSONObject();
    JSONObject CondJsonObject = new JSONObject();
    JSONObject DetailsJsonObject = new JSONObject();
    JSONObject actionIconsJsonObject = new JSONObject();
    JSONObject actionIconActionJsonObject;
    JSONObject actionIconConditionJsonObject;
    JSONObject actionIconErrorJsonObject;
    JSONObject autoTransition;
    JSONObject autoTransitionProps;
    JSONObject autoTransitionDetails;

    try {
      Aktion nextAction = action.getFolgeAktion();
      Bedingung condition = action.getBedingung();
      CondJsonObject = getCondJson(condition,locale);
      EVerarbeitungsTyp procType = condition.getVerarbeitungsTyp();
      IProcessing proc = condition.getAktionsVerarbeitung();
      String actionIcon = proc.getIcon();
      Boolean stopsWorkflow = false;

      actionIconActionJsonObject = getImageIcon(actionIcon, imageFont, imageFontMap, imageFontValues);
      actionIconConditionJsonObject = new JSONObject();
      actionIconErrorJsonObject = new JSONObject();

      actionIconsJsonObject.put("action", actionIconActionJsonObject.get("id"));
      actionIconsJsonObject.put("condition", "");
      actionIconsJsonObject.put("error", "");

      // Properties
      PropJsonObject.put("de.xima.fc.action.name", action.getName());
      PropJsonObject.put("de.xima.fc.action.active", action.isAktiv());
      PropJsonObject.put("de.xima.fc.action.condition", CondJsonObject);
      PropJsonObject.put("de.xima.fc.action.details", DetailsJsonObject);
      PropJsonObject.put("de.xima.fc.action.details", DetailsJsonObject);
      PropJsonObject.put("de.xima.fc.action.providesFile", proc.isFileProviding());
      PropJsonObject.put("de.xima.fc.action.icons", actionIconsJsonObject);

      switch (procType) {
        case ADD_FILE_TO_VORGANG:
          VerarbeitungInbox procInbox = (VerarbeitungInbox)(proc);
          PropJsonObject.put("de.xima.fc.action.requiresFile", true);
          PropJsonObject.put("de.xima.fc.action.type", 2);
          DetailsJsonObject.put("loadFrom", getFileActionIds(procInbox.getAktionsIdErgebnisse()));
          break;
        case CALLBACK:
          PropJsonObject.put("de.xima.fc.action.requiresFile", false);
          PropJsonObject.put("de.xima.fc.action.type", 1);

          break;
        case CHANGE_STATUS:
          VerarbeitungChangeStatus procChangeState = (VerarbeitungChangeStatus)(proc);
          PropJsonObject.put("de.xima.fc.action.requiresFile", false);
          PropJsonObject.put("de.xima.fc.action.type", 15);
          DetailsJsonObject.put("targetStatus", "de.xima.fc.status-" + String.valueOf(procChangeState.getStatusId()));

          // Add automatic transition to edges.
          autoTransition = new JSONObject();
          autoTransitionProps = new JSONObject();
          autoTransitionDetails = new JSONObject();

          autoTransitionDetails.put("initiator", "de.xima.fc.action-" + String.valueOf(action.getId()));

          autoTransitionProps.put("de.xima.fc.transition.type", "AUTO");
          autoTransitionProps.put("de.xima.fc.transition.details", autoTransitionDetails);

          autoTransition.put("id", "de.xima.fc.transition-auto_" + String.valueOf(action.getId()));
          autoTransition.put("source", "de.xima.fc.status-" + String.valueOf(status.getId()));
          autoTransition.put("target", "de.xima.fc.status-" + String.valueOf(procChangeState.getStatusId()));
          autoTransition.put("properties", autoTransitionProps);
          transitionsJsonArray.put(autoTransition);
          break;
        case COMPRESS_AS_ZIP:
          PropJsonObject.put("de.xima.fc.action.requiresFile", true);
          PropJsonObject.put("de.xima.fc.action.type", 10);

          break;
        case COPY_TO_POSTFACH:
          PropJsonObject.put("de.xima.fc.action.requiresFile", false);
          PropJsonObject.put("de.xima.fc.action.type", 21);

          break;
        case COPY_TO_STATUS:
          VerarbeitungCopyToStatus procCopyState = (VerarbeitungCopyToStatus)(proc);
          PropJsonObject.put("de.xima.fc.action.requiresFile", false);
          PropJsonObject.put("de.xima.fc.action.type", 19);
          DetailsJsonObject.put("targetStatus", "de.xima.fc.status-" + String.valueOf(procCopyState.getStatusId()));
          // Add automatic transition to edges.
          autoTransition = new JSONObject();
          autoTransitionProps = new JSONObject();
          autoTransitionDetails = new JSONObject();

          autoTransitionDetails.put("initiator", "de.xima.fc.action-" + String.valueOf(action.getId()));

          autoTransitionProps.put("de.xima.fc.transition.type", "AUTO");
          autoTransitionProps.put("de.xima.fc.transition.details", autoTransitionDetails);

          autoTransition.put("id", "de.xima.fc.transition-auto_" + String.valueOf(action.getId()));
          autoTransition.put("source", "de.xima.fc.status-" + String.valueOf(status.getId()));
          autoTransition.put("target", "de.xima.fc.status-" + String.valueOf(procCopyState.getStatusId()));
          autoTransition.put("properties", autoTransitionProps);
          transitionsJsonArray.put(autoTransition);
          break;
        case DB_SQL_STATEMENT:
          VerarbeitungDbSQLQuery procSql = (VerarbeitungDbSQLQuery)(proc);    
          PropJsonObject.put("de.xima.fc.action.requiresFile", false);
          PropJsonObject.put("de.xima.fc.action.type", 4);
          DetailsJsonObject.put("sqlStatement",procSql.getQuery());
          break;
        case DELETE_VORGANG:
          PropJsonObject.put("de.xima.fc.action.requiresFile", false);
          PropJsonObject.put("de.xima.fc.action.type", 23);
          stopsWorkflow = true;
          break;
        case EMAIL:
          VerarbeitungEmail procEMail = (VerarbeitungEmail)(proc);        
          PropJsonObject.put("de.xima.fc.action.requiresFile", true);
          PropJsonObject.put("de.xima.fc.action.type", 5);
          DetailsJsonObject.put("headerTo",procEMail.getTo());
          DetailsJsonObject.put("headerFrom",procEMail.getFrom());
          DetailsJsonObject.put("headerSubject",procEMail.getSubject());
          DetailsJsonObject.put("body",procEMail.getBody());
          DetailsJsonObject.put("loadFrom", getFileActionIds(procEMail.getAktionsIdErgebnisse()));
          break;
        case EXTERNAL_RESOURCE:
          VerarbeitungExterneRessource procExternalResource = (VerarbeitungExterneRessource)(proc);    
          PropJsonObject.put("de.xima.fc.action.requiresFile", false);
          PropJsonObject.put("de.xima.fc.action.type", 8);
          DetailsJsonObject.put("resourceURL",procExternalResource.getResource());
          DetailsJsonObject.put("saveAs",procExternalResource.getExportName());
          break;
        case MOVE_TO_POSTFACH:
          PropJsonObject.put("de.xima.fc.action.requiresFile", false);
          PropJsonObject.put("de.xima.fc.action.type", 22);
          break;
        case PDF_FILL:
          PropJsonObject.put("de.xima.fc.action.requiresFile", false);
          PropJsonObject.put("de.xima.fc.action.type", 11);
          break;
        case PERSISTENCE_EXPORT:
          VerarbeitungExportPersistence procExportPersistence = (VerarbeitungExportPersistence)(proc);    
          PropJsonObject.put("de.xima.fc.action.requiresFile", false);
          PropJsonObject.put("de.xima.fc.action.type", 6);
          DetailsJsonObject.put("saveAs",procExportPersistence.getExportFileName());
          break;
        case PLUGIN:
          PropJsonObject.put("de.xima.fc.action.requiresFile", false);
          PropJsonObject.put("de.xima.fc.action.type", 13);
          break;
        case POST:
          PropJsonObject.put("de.xima.fc.action.requiresFile", false);
          PropJsonObject.put("de.xima.fc.action.type", 12);
          break;
        case PROVIDE_UPLOAD:
          PropJsonObject.put("de.xima.fc.action.requiresFile", false);
          PropJsonObject.put("de.xima.fc.action.type", 17);
          break;
        case REDIRECT:
          PropJsonObject.put("de.xima.fc.action.requiresFile", false);
          PropJsonObject.put("de.xima.fc.action.type", 24);
          break;
        case RENEW_PROZESSID:
          PropJsonObject.put("de.xima.fc.action.requiresFile", false);
          PropJsonObject.put("de.xima.fc.action.type", 20);
          break;
        case RETURN_FILE:
          VerarbeitungReturnFile procReturnFile = (VerarbeitungReturnFile)(proc);    
          PropJsonObject.put("de.xima.fc.action.requiresFile", true);
          PropJsonObject.put("de.xima.fc.action.type", 3);
          DetailsJsonObject.put("loadFrom", getFileActionIds(procReturnFile.getAktionsIdErgebnisse()));
          DetailsJsonObject.put("forceDownload", procReturnFile.getForceDownload());
          break;
        case SAVE_TO_FILESYSTEM:
          PropJsonObject.put("de.xima.fc.action.requiresFile", true);
          PropJsonObject.put("de.xima.fc.action.type", 14);
          break;
        case SEND_TO_SALESFORCE:
          PropJsonObject.put("de.xima.fc.action.requiresFile", false);
          PropJsonObject.put("de.xima.fc.action.type", -1);
          break;
        case SHOW_TEMPLATE:
          VerarbeitungTemplate procShowTemplate = (VerarbeitungTemplate)(proc);
          Integer htmlID = procShowTemplate.getTextbausteinId();
          addHTMLResource(htmlID,htmlJsonObject,textbausteinListe);
          DetailsJsonObject.put("targetTemplate","de.xima.fc.resource.html-" + String.valueOf(htmlID));
          PropJsonObject.put("de.xima.fc.action.requiresFile", false);
          PropJsonObject.put("de.xima.fc.action.type", 0);
          break;
        case STOP:
          PropJsonObject.put("de.xima.fc.action.requiresFile", false);
          PropJsonObject.put("de.xima.fc.action.type", 18);
          stopsWorkflow = true;
          break;
        case WORD_FILL:
          PropJsonObject.put("de.xima.fc.action.requiresFile", false);
          PropJsonObject.put("de.xima.fc.action.type", 25);
          break;
        case WRITE_TO_FILE:
          PropJsonObject.put("de.xima.fc.action.requiresFile", false);
          PropJsonObject.put("de.xima.fc.action.type", 16);
          break;
        case WRITE_TO_FORM:
          VerarbeitungWriteToForm procWriteToForm = (VerarbeitungWriteToForm)(proc);    
          Map<String,String> parameterMap = procWriteToForm.getParamMap();
          JSONArray parameterJsonArray = new JSONArray();
          PropJsonObject.put("de.xima.fc.action.requiresFile", false);
          PropJsonObject.put("de.xima.fc.action.type", 9);
          for (Map.Entry<String,String> entry : parameterMap.entrySet()) {
            JSONObject parameter = new JSONObject();
            parameter.put("key",entry.getKey());
            parameter.put("value",entry.getValue());
            parameterJsonArray.put(parameter);
          }
          DetailsJsonObject.put("formChanges",parameterJsonArray);
          break;
        case XML_EXPORT:
          VerarbeitungExport procExportXml = (VerarbeitungExport)(proc);    
          Integer xslID = procExportXml.getTextbausteinId();
          addXSLResource(xslID,xslJsonObject,textbausteinListe);
          PropJsonObject.put("de.xima.fc.action.requiresFile", false);
          PropJsonObject.put("de.xima.fc.action.type", 7);
          DetailsJsonObject.put("saveAs",procExportXml.getExportFileName());
          DetailsJsonObject.put("sanitizeOutput",procExportXml.getHtmlOutput());
          DetailsJsonObject.put("xslTemplate","de.xima.fc.resource.xsl-" + String.valueOf(xslID));
          break;
        case XML_TO_FD:
          PropJsonObject.put("de.xima.fc.action.requiresFile", true);
          PropJsonObject.put("de.xima.fc.action.type", 26);
          break;
      }

      switch (action.getWeiterverarbeitungBeiFehler()) {
        case ABBRUCH:
          PropJsonObject.put("de.xima.fc.action.onError", "STOP");
          break;
        case KONFIGURIERTE_FOLGEAKTION:
          PropJsonObject.put("de.xima.fc.action.onError", "de.xima.fc.action-" + String.valueOf(nextAction.getId()));
          break;
      }
      PropJsonObject.put("de.xima.fc.action.stopsWorkflow", stopsWorkflow);
      PropJsonObject.put("de.xima.fc.action.onErrorDisplayName", action.getWeiterverarbeitungBeiFehler().getDisplayName(locale));
      PropJsonObject.put("de.xima.fc.action.displayName", procType.getDisplayName(locale));

      // Main
      j.put("id", "de.xima.fc.action-" + String.valueOf(action.getId()));
      j.put("properties", PropJsonObject);
    }
    catch (Exception e) {
      e.printStackTrace();
    }

    return j;
  }

  public void setupUserGroup(BenutzerGruppe userGroup, JSONObject resourceUserGroups, Locale locale) {
    try {
      JSONObject userGroupJsonObject = new JSONObject();
      JSONArray users = new JSONArray();
      JSONArray mailboxAccess = new JSONArray();
      String userGroupID = "de.xima.fc.resource.userGroup-" + String.valueOf(userGroup.getId());
      if (!resourceUserGroups.has(userGroupID)) {
        userGroupJsonObject.put("id", userGroupID);
        userGroupJsonObject.put("name", userGroup.getName());
        userGroupJsonObject.put("description", userGroup.getBeschreibung());
        userGroupJsonObject.put("systemID", String.valueOf(userGroup.getId()));
        userGroupJsonObject.put("users", users);
        userGroupJsonObject.put("mailboxAccess", mailboxAccess);
        resourceUserGroups.put(userGroupID, userGroupJsonObject);
      }
    }
    catch (Exception e) {
      e.printStackTrace();
    }
  }

  public JSONArray getRestrictionsFrom(List<BenutzerGruppe> userGroups, JSONObject resourceUserGroups, Locale locale) {
    JSONArray j = new JSONArray();
    try {
      for (BenutzerGruppe b : userGroups) {
        setupUserGroup(b, resourceUserGroups, locale);
        j.put("de.xima.fc.resource.userGroup-" + String.valueOf(b.getId()));
      }
    }
    catch (Exception e) {
      e.printStackTrace();
    }
    return j;
  }

  public JSONArray getTransitionsFrom(List<Status> statusList) {
    JSONArray j = new JSONArray();
    try {
      for (Status s : statusList) {
        j.put("de.xima.fc.status-" + String.valueOf(s.getId()));
      }
    }
    catch (Exception e) {
      e.printStackTrace();
    }
    return j;

  }

  // Create status json object.
  public JSONObject getStatusJson(Status status, JSONObject imageFont, JSONObject resourceUserGroups, JSONArray transitionsJsonArray, Locale locale, Map<String,Integer> imageFontMap, Map<String,String> imageFontValues, JSONObject htmlJsonObject, JSONObject xslJsonObject, List<Textbaustein> textbausteinListe) {

    JSONObject j = new JSONObject();
    JSONObject PropObject = new JSONObject();
    JSONArray ActionArray = new JSONArray();
    JSONArray restrictionsFromJsonArray;
    JSONArray transitionsFromJsonArray;
    JSONObject manualTransition;
    JSONObject manualTransitionProps;
    JSONObject manualTransitionDetails;
    JSONObject timedTransition;
    JSONObject timedTransitionProps;
    JSONObject timedTransitionDetails;
    try {

      List<Aktion> actions = status.getAktionen();
      List<BenutzerGruppe> restrictionsFrom = status.getBenutzerGruppenUsageRight();
      List<Status> transitionsFrom = status.getStatusPre();
      Integer transitionID = 0;

      Status timerTargetStatus = status.getTimerTargetStatus();
      Integer timerOffset = status.getTimerExecOffset();
      restrictionsFromJsonArray = getRestrictionsFrom(restrictionsFrom, resourceUserGroups, locale);
      transitionsFromJsonArray = getTransitionsFrom(transitionsFrom);

      // Manual transitions
      for (Status s : transitionsFrom) {
        manualTransition = new JSONObject();
        manualTransitionProps = new JSONObject();
        manualTransitionDetails = new JSONObject();

        manualTransitionDetails.put("restrictToUserGroup", restrictionsFromJsonArray);

        manualTransitionProps.put("de.xima.fc.transition.type", "MANUAL");
        manualTransitionProps.put("de.xima.fc.transition.details", manualTransitionDetails);

        manualTransition.put("id", "de.xima.fc.transition-manual-" + String.valueOf(status.getId()) + "-" + String.valueOf(transitionID++));
        manualTransition.put("source", "de.xima.fc.status-" + String.valueOf(s.getId()));
        manualTransition.put("target", "de.xima.fc.status-" + String.valueOf(status.getId()));
        manualTransition.put("properties", manualTransitionProps);
        transitionsJsonArray.put(manualTransition);
      }

      // Actions
      for (Aktion a : actions) {
        ActionArray.put(getAktionJson(a, imageFont, status, transitionsJsonArray, locale, imageFontMap, imageFontValues, htmlJsonObject, xslJsonObject, textbausteinListe));
      }

      // Properties
      PropObject.put("de.xima.fc.status.name", status.getName());
      PropObject.put("de.xima.fc.status.identifier", status.getAlias());
      PropObject.put("de.xima.fc.status.comments", status.getBemerkung());
      PropObject.put("de.xima.fc.status.deletable", status.isVorgangLoeschbar());
      PropObject.put("de.xima.fc.status.icon", JSONObject.NULL);
      PropObject.put("de.xima.fc.status.timedTransitionSeconds", status.getTimerExecOffset());
      PropObject.put("de.xima.fc.status.timedTransitionOnlyForUnread", status.getTimerOnlyUnread());
      PropObject.put("de.xima.fc.status.restrictionsFrom", restrictionsFromJsonArray);
      PropObject.put("de.xima.fc.status.transitionsFrom", transitionsFromJsonArray);
      PropObject.put("de.xima.fc.status.onErrorDisplayName", status.getWeiterverarbeitungBeiFehler().getDisplayName(locale));

      if (timerOffset == 0) {
        PropObject.put("de.xima.fc.status.hasTimedTransition", false);
      }
      else {
        PropObject.put("de.xima.fc.status.hasTimedTransition", true);
      }
      if (timerTargetStatus != null) {
        PropObject.put("de.xima.fc.status.timedTransitionTarget", "de.xima.fc.status-" + String.valueOf(timerTargetStatus.getId()));
        // Add timed transition to edges.
        timedTransition = new JSONObject();
        timedTransitionProps = new JSONObject();
        timedTransitionDetails = new JSONObject();

        timedTransitionDetails.put("transitionAfter", timerOffset);
        timedTransitionDetails.put("onlyForUnread", status.getTimerOnlyUnread());

        timedTransitionProps.put("de.xima.fc.transition.type", "TIMED");
        timedTransitionProps.put("de.xima.fc.transition.details", timedTransitionDetails);

        timedTransition.put("id", "de.xima.fc.transition-timed_" + String.valueOf(transitionID++));
        timedTransition.put("source", "de.xima.fc.status-" + String.valueOf(status.getId()));
        timedTransition.put("target", "de.xima.fc.status-" + String.valueOf(timerTargetStatus.getId()));
        timedTransition.put("properties", timedTransitionProps);
        transitionsJsonArray.put(timedTransition);
      }
      else {
        PropObject.put("de.xima.fc.status.timedTransitionTarget", "de.xima.fc.null");
      }

      switch (status.getWeiterverarbeitungBeiFehler()) {
        case ABBRUCH:
          PropObject.put("de.xima.fc.status.onError", "STOP");
          break;
        case STATUS_TROTZDEM_WECHSELN:
          PropObject.put("de.xima.fc.status.onError", "PROCEED");
          break;
      }
      switch (status.getStatusTyp()) {
        case EINGEGANGEN:
          PropObject.put("de.xima.fc.status.hasSourceRestrictions", false);
          PropObject.put("de.xima.fc.status.hasSourceTransitions", false);
          PropObject.put("de.xima.fc.status.isIncoming", true);
          PropObject.put("de.xima.fc.status.isOutgoing", false);
          break;
        case STANDARD:
          PropObject.put("de.xima.fc.status.hasSourceRestrictions", true);
          PropObject.put("de.xima.fc.status.hasSourceTransitions", true);
          PropObject.put("de.xima.fc.status.isIncoming", false);
          PropObject.put("de.xima.fc.status.isOutgoing", false);
          break;
      }

      // Main
      j.put("id", "de.xima.fc.status-" + String.valueOf(status.getId()));
      j.put("children", ActionArray);
      j.put("properties", PropObject);
    }
    catch (Exception e) {
      e.printStackTrace();
    }

    return j;
  }%>

<%
  JSONObject json = new JSONObject();

  JSONArray statusJsonArr = new JSONArray();
  JSONArray edgesJsonArr = new JSONArray();
  JSONObject propJsonObject = new JSONObject();

  JSONObject resourcesJsonObject = new JSONObject();

  JSONObject userGroupJsonObject = new JSONObject();
  JSONObject htmlJsonObject = new JSONObject();
  JSONObject xslJsonObject = new JSONObject();
  JSONObject urlJsonObject = new JSONObject();
  JSONObject mailboxJsonObject = new JSONObject();
  JSONObject pluginJsonObject = new JSONObject();
  JSONObject fontJsonObject = new JSONObject();
  JSONObject imageJsonObject = new JSONObject();
  JSONObject imageFontJsonObject = new JSONObject();
  JSONObject imageSvgJsonObject = new JSONObject();
  JSONObject imageImageJsonObject = new JSONObject();

  JSONObject sentinelFontJsonObject = new JSONObject();

  Integer prettyPrint;

  IEntityContext ec = null;
  try {
    ec = EntityContextFactory.newSystemEntityContext();
    response.setContentType("application/json");

    Integer projektId = (StringUtils.isNotEmpty(request.getParameter("pid"))) ? Integer.parseInt(request.getParameter("pid")) : 152;
    String localeString = (StringUtils.isNotEmpty(request.getParameter("lang"))) ? request.getParameter("lang") : "de";
    prettyPrint = (StringUtils.isNotEmpty(request.getParameter("pretty"))) ? Integer.parseInt(request.getParameter("pretty")) : -1;
    
    Projekt projekt = DaoProvider.PROJEKT_DAO.read(ec, projektId);
    List<Status> statusListe = DaoProvider.STATUS_DAO.getAllByProjekt(ec, projekt);
    List<Textbaustein> textbausteinListe = DaoProvider.TEXTBAUSTEIN_DAO.getAll(ec, projekt.getMandant());
    
    Map<String,String> imageFontValues = new HashMap<String,String>();
    Map<String,Integer> imageFontMap   = new HashMap<String,Integer>();
    
    fillImageFontMap(imageFontMap);
    Locale locale = new Locale(localeString);

    Status wiedervorlage = projekt.getStatusNachWiedervorlage();

    // Status array.	
    for (Status s : statusListe) {
      statusJsonArr.put(getStatusJson(s, imageFontJsonObject, userGroupJsonObject, edgesJsonArr, locale, imageFontMap, imageFontValues, htmlJsonObject, xslJsonObject, textbausteinListe));
    }

    // Sentinel font
    sentinelFontJsonObject.put("id", "de.xima.fc.resource.font-0");
    sentinelFontJsonObject.put("mime", "");
    sentinelFontJsonObject.put("sourceType", "FAMILY");
    sentinelFontJsonObject.put("sourceData", "de.xima.fc.resource.font.sentinel");

    // Resource Font
    fontJsonObject.put("de.xima.fc.resource.font-0", sentinelFontJsonObject);

    // Image resources
    imageJsonObject.put("font", imageFontJsonObject);
    imageJsonObject.put("svg", imageSvgJsonObject);
    imageJsonObject.put("image", imageImageJsonObject);

    // Resources properties.
    resourcesJsonObject.put("userGroup", userGroupJsonObject);
    resourcesJsonObject.put("html", htmlJsonObject);
    resourcesJsonObject.put("xsl", xslJsonObject);
    resourcesJsonObject.put("url", urlJsonObject);
    resourcesJsonObject.put("mailbox", mailboxJsonObject);
    resourcesJsonObject.put("plugin", pluginJsonObject);
    resourcesJsonObject.put("font", fontJsonObject);
    resourcesJsonObject.put("image", imageJsonObject);

    // Main properties.
    propJsonObject.put("de.xima.fc.diagramType", "LAYERED");
    propJsonObject.put("de.xima.fc.resources", resourcesJsonObject);
    propJsonObject.put("de.xima.fc.statusOnResubmission", "de.xima.fc.status-" + String.valueOf(wiedervorlage.getId()));
    propJsonObject.put("de.xima.fc.statusOnSubmission", "de.xima.fc.status-" + String.valueOf(statusListe.get(0).getId()));

    // Fill main json.
    json.put("id", "de.xima.fc.workflow");
    json.put("children", statusJsonArr);
    json.put("edges", edgesJsonArr);
    json.put("properties", propJsonObject);

  }
  finally {
    if (ec != null) ec.close();
  }

  if (prettyPrint>0) {
    out.print(json.toString(prettyPrint));
  }
  else {
    out.print(json.toString());
  }
%>
