import React, { useMemo, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { ChevronLeft, Paperclip, ShieldCheck, Database } from "lucide-react";

/**
 * =========================
 * SUPABASE AYARLARI (Sadece Okuma)
 * =========================
 */
const SUPABASE_URL = "https://onnsaeorzwzgusdamqdi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ubnNhZW9yend6Z3VzZGFtcWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTA1MzcsImV4cCI6MjA4NjY2NjUzN30.Z89JNhn0c1X0FgPP5w45UxzQ3_rg2XSdApyPLI1x1BQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const TABLE = "factshield";

/**
 * =========================
 * TYPES & HELPERS
 * =========================
 */
interface Post {
  id: number;
  title: string;
  author: string;
  content: string;
  date: string; 
  files: string[];
}

function toDateYMD(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  return d.toISOString().slice(0, 10);
}

function excerpt(text: string, max = 420) {
  const s = (text ?? "").trim();
  if (s.length <= max) return s;
  return s.slice(0, max).trimEnd() + "…";
}

/**
 * =========================
 * SEO: Dynamic meta per view (Home / Post detail)
 * NO / SE / DK / EU / TR odaklı
 * =========================
 */
const SEO_KEYWORDS =
  "OSINT Norge, OSINT Sverige, OSINT Danmark, open source intelligence Europe, " +
  "digital etterforskning Norden, faktasjekk Norge, faktakoll Sverige, kildekritikk, " +
  "DOJ dokumentanalyse, unsealed court records, mahkeme belgesi analizi, " +
  "açık kaynak istihbarat Türkiye, sahte haber analizi, Epstein rettsdokumenter, " +
  "Nordic investigative journalism, digital forensics Scandinavia, misinformasjon, desinformasjon,OSINT Norge, OSINT Sverige, OSINT Danmark,mette-marit sykdom, mette-marit ung, mette-marit reddit, mette-marit rusmisbruk, mette-marit av norge, mette-marit av norge utdanning, mette-marit søster, mette-marit rykter, mette-marit søsken, mette-marit alder, mette-marit av norge høyde, mette-marit av norge ung, mette-marit av norge alder, mette-marit av norge epstein, mette-marit aftonbladet, mette-marit aftenposten, mette-marit av norge barn, mette-marit barn, mette-marit bryllupstale, mette-marit blind, mette-marit bunad, mette-marit bilder, mette-marit bror utøya, mette-marit beskytterskap, mette-marit brudekjole, mette-marit bror fengsel, mette-marit bryllup 2012, mette-marit crown princess of norway, mette-marit crown princess, mette-marit children, mette-marit crown princess of norway wedding, mette-marit crown princess of norway illness, mette-marit crown princess of norway lung transplant, mette marit choroba, mette marit crown princess of norway height, mette marit cystisk fibrose, mette marit cigarette, mette-marit donor, mette-marit dødsrisiko, mette-marit dagbladet, mette-marit de noruega, mette marit de noruega enfermedad, mette marit dating show, dzieci mette marit, mette marit deutsch, mette marit de norvège enfants, mette marit daughter, mette-marit etter operasjon, mette-marit eksmann, mette-marit epstein-intervju, mette-marit epstein, mette-marit eks-kjæreste, mette-marit epstein 2019, mette-marit epstein-meldinger, mette-marit epstein felles venn, mette-marit epstein files, mette-marit epstein reddit, mette-marit flashback, mette-marit fortid, mette-marit formue, mette-marit fengsel, mette-marit forsvaret, mette-marit forum, mette-marit far, mette-marit festing, mette-marit fibrose, mette-marit familie, mette-marit giftering, mette-marit gift, mette-marit gesundheit verschlechtert, mette-marit gift med haakon, mette marit gesundheit, mette marit gesicht verändert, mette marit grand mère, mette marit giftet seg, mette marit gesundheit aktuell, mette marit geburtstag, mette-marit høyde, mette-marit helse, mette-marit har fått nye lunger, mette-marit høyde vekt, mette-marit hele intervju, mette-marit haakon, mette-marit health, mette-marit hijos, mette marit hochzeit, mette marit husband, mette-marit intervju, mette-marit intervju nrk, mette-marit i dag, mette-marit intervju reddit, mette-marit ill, mette-marit intervju epstein, mette-marit instagram privat, mette-marit interview, mette marit illness, mette marit instagram, mette-marit joven fotos, mette-marit jeffrey epstein, mette marit jung, mette marit jeffrey, mette marit jobb, mette marit jaget med kniv, mette marit jodel, mette marit juel gulliksen, mette marit jazzplate, mette marit julekule, mette-marit kvinneguiden, mette-marit kongsved, mette-marit krankheit lebenserwartung, mette marit krankheit, mette marit krank, mette marit krankheit aktuell heute, mette marit krankenhaus, mette marit königin, mette marit kronprinsesse, mette marit kids, mette-marit lungetransplantasjon, mette-marit lungefibrose, mette-marit lege, mette-marit lungefibrose røyking, mette-marit lysthuset tiktok, mette-marit lungefibrose årsak, mette-marit lungefibrose prognose, mette-marit lungesykdom, mette-marit lysthuset youtube, mette-marit lysthuset, mette-marit mor, mette-marit marius reddit, mette-marit mann, mette-marit mor alder, mette-marit med pustemaskin, mette-marit marius, mette-marit malattia, mette marit maladie, mette marit marriage, mette marit mail, mette-marit nye lunger, mette-marit nrk, mette-marit nyheter, mette-marit norveška prestolonaslednik, mette-marit nrk intervju, mette-marit news, mette-marit nettavisen, mette-marit norway, mette-marit norge, mette-marit norská, mette-marit operasjon, mette-marit og epstein, mette-marit og haakon, mette-marit oksygen, mette-marit og reitan, mette-marit operert, mette-marit og haakon bryllup, mette-marit og forsvaret, mette-marit og marius, mette-marit of norway, mette-marit pustemaskin, mette-marit på sykehuset, mette-marit plastisk kirurgi, mette-marit på balkongen, mette-marit pustehjelp, mette-marit pustemaske, mette-marit pulmonary fibrosis cause, mette-marit prințesă a norvegiei, mette-marit pojan isä, mette-marit princesa herdeira da noruega, mette marit que enfermedad tiene, mette marit quart festival, mette marit queen elizabeth, mette marit quora, mette marit quart, mette marit quotes, mette marit quiz, queen of norway mette marit, mette marit quien es, mette marit que le pasa, mette-marit reitan, mette-marit rikshospitalet, mette-marit rusproblemer, mette-marit rus bakgrunn, mette-marit rullestol, mette-marit røyke bilde, mette-marit raseriutbrudd, mette-marit siste nytt, mette-marit syk, mette-marit sønn, mette-marit sjekkeprogram, mette-marit sigarett, mette-marit storesøster, mette-marit sykdom levetid, mette-marit tjessem høiby, mette-marit transplantasjon, mette-marit temperament, mette-marit tv4, mette-marit tidligere liv, mette-marit tv4.se, mette-marit tjessem, mette-marit transplantation, mette-marit tv2, mette-marit tjessem høiby young, mette-marit ung fest, mette-marit utdannelse, mette-marit ung rus, mette marit ungdom, mette marit uttalelse, mette marit update, mette marit ultimas noticias, mette marit ungdomstid, mette marit und marius, mette-marit vg, mette-marit vekt, mette-marit venteliste, mette-marit ville vite alt, mette-marit von norwegen, mette-marit vergangenheit, mette marit vater, mette marit vår tids askepott, mette marit venn, mette marit verdens beste sfo, mette-marit wiki, mette-marit wedding bouquet, mette marit wedding, mette marit wykształcenie, mette marit wedding dress, mette marit wiek, mette marit wikipedia english, mette marit wallpaper, mette marit wikipedia deutsch, mette marit with epstein, mette marit x epstein, mette marit x mann, mette marit casual, mette marit exmann, mette marits ex, mette-marit young, epstein y mette marit, mette marit youtube, mette marit young photos, mette marit y felipe, mette marit yacht, mette marit y eva sannum, mette marit yngre, mette marit yoga, mette marit young global leaders, mette-marit zoon, mette-marit ziek, mette marit zdf, mette marit zdrowie, mette marit zeit, mette marit zodiac, mette marit zodiac sign, mette marit ziekte, mette marit zustand, mette marit zuurstof, alder mette marit, age mette marit, aktuell news mette marit, affäre mette marit, alter mette marit, aktuelle bilder mette marit, a princesa mette marit, altura mette marit, prinsesse mette marit, affäre mette marit epstein, boris nikolic mette marit, bryllupet mellom kronprins haakon og mette marit tjessem høiby, bryllup mette marit og håkon, blir mette marit dronning, broren til mette marit, bild zeitung mette marit, blir mette marit dronning når håkon blir konge, bilde av mette marit, bilde av mette marit epstein, bursdag mette marit, crown princess mette marit, cystisk fibrose mette marit, cnn mette marit, crown princess mette marit illness, crown princess mette marit health, cuando se caso mette marit, crown princess mette marit oxygen, crown princess mette marit of norway, crown princess mette marit wedding, crown princess mette marit of norway latest news, dagbladet mette marit, das bild mette marit, diskutopia mette marit, datter til mette marit, diagnose mette marit, dronning mette marit, det norske jentekor mette marit, dokumentar mette marit, donor mette marit, durek mette marit, epstein mette marit, epstein og mette marit, epstein mette marit meldinger, epstein og mette marit meldinger, epstein kronprinsesse mette marit, eksmann mette marit, epstein og mette marit forhold, ex mette marit, er mette-marit operert, emails mette marit, far til mette marit, forum mette marit, forlover mette marit, flyskrekk mette marit, foreldre mette marit, fullt intervju mette marit, formue mette marit, familie mette marit, facebook mette marit, foto mette marit, gamle bilder av mette marit, går det bra med mette marit, gwyneth paltrow mette marit, ghislaine maxwell mette marit, guru mette marit, gullfugl mette marit, geelmuyden mette marit, google mette marit, größe mette marit, giftemål mette marit, har mette marit en søster, hvor er mette marit nå, hvilken sykdom har mette marit, hvor gammel er mette marit, hva gjorde mette marit hos epstein, hvordan går det med mette marit, håkon og mette marit, hvor høy er mette marit, hvilken lungesykdom har mette marit, hvorfor hadde mette marit kontakt med epstein, intervju mette marit, intervju mette marit nrk, inyheter mette marit, isfront mette marit, intervju mette marit epstein, intervju mette marit reddit, instagram mette marit, ingrid alexandra mette marit, intervju kronprinsesse mette marit, is mette marit sick, jeffrey epstein mette marit, john ognby mette marit, jeffrey epstein og mette marit, jeffrey epstein mette marit meldinger, jon niklas rønning mette marit, jodel mette marit, jonas gahr støre mette marit, julekule mette marit, jon fosse mette marit, jmail mette marit, kronprinsesse mette marit, kronprinsesse mette marit epstein, kronprinsesse mette marit sykdom, kan mette marit bli dronning, kronprins haakon og mette marit, kvinneguiden mette marit, kronprinsesse mette marit lungesykdom, kan mette marit dø av sykdommen, kronprins mette marit, kronprins haakon mette marit, lysthuset mette marit, lungefibrose levetid mette marit, lungesykdom mette marit, lungefibrose mette marit, lever mor til mette marit, lungetransplantasjon mette marit, lungefibrose prognose mette marit, lunger mette marit, mette marit lungefibrose, la mette marit, meldinger mellom mette marit og epstein, mor til mette marit, magnus reitan mette marit, meldinger mette marit og epstein, marius mette marit, marius borg høiby mette marit, mor mette marit, morten borg mette marit, marius og mette marit, mail mette marit, nrk mette marit intervju, når giftet mette marit og håkon seg, når giftet mette marit seg, nrk mette marit, når sluttet mette marit å røyke, når ble mette marit og håkon sammen, nyheter mette marit, norway mette marit, news mette marit epstein, nye lunger mette marit, ognby og mette marit, ole robert reitan mette marit reddit, oddvar stenstrøm mette marit, ognby mette marit, ole edvard wold reitan mette marit, ole edvard reitan mette marit, ole robert mette marit, odd reitan mette marit, om mette marit, operasjon mette marit, prinsesse ragnhild mette marit, parodi mette marit, princess mette marit, pustemaskin mette marit, palm beach mette marit, paris mette marit, princess mette marit of norway, photo mette marit epstein, princesa mette marit, que le pasa a mette marit, que enfermedad tiene mette marit de noruega, que le pasa a mette marit de noruega, qué enfermedad tiene mette marit, que tiene mette marit, quién es mette marit, qui est mette marit, quanti figli ha mette marit, quartfestivalen mette marit, queen mette marit, reddit mette marit, røyker mette marit, røyker mette marit fortsatt, reitan mette marit, reitan og mette marit, rykter om mette marit, røde kors mette marit, reddit norge mette marit, reddit mette marit intervju, reddit mette marit reitan, sykdom mette marit, siste nytt om mette marit, sigrid bonde tusvik mette marit, se og hør mette marit, sønnen til mette marit, sang om mette marit, sjekkeprogram mette marit, søster mette marit, søsken mette marit, skilsmisse rykter mette marit, tv2 mette marit, tore renberg mette marit, tusvik mette marit, trygve hegnar om mette marit, trygve hegnar mette marit, tusvik og tønne mette marit, the sun mette marit, tannbleking mette marit, transplantasjon mette marit, tv norge mette marit, ung mette marit, utdannelse mette marit, uttalelse mette marit, ungene til mette marit, uten filter mette marit, ungdomsbilder av mette marit, undringskompetanse mette marit, utenlandsk presse om mette marit, utøya mette marit, underholdningsavdelingen mette marit, vg mette marit, vem är mette marit, vem är mette marit gift med, vg mette marit epstein, video mette marit, vg mette marit meldinger, verleden mette marit, vater von mette marit sohn, vennen til mette marit, venn av mette marit, was hat mette marit für eine krankheit, warum mette marit so schnell neue lunge, who is mette marit, wiki mette marit, who is mette marit of norway, mette marit hat, wie geht es mette marit aktuell, wie geht es mette marit, who is crown princess mette marit, welche krankheit hat mette marit, mette marit epstein x, ex mann mette marit, marit x, youtube mette marit, you tickle my brain mette marit, ylvis mette marit, ylvis stories from norway mette marit, young mette marit, yacht mette marit, youtube lysthuset mette marit, youtube mette marit sjekkeprogram, young global leaders mette marit, ygl mette marit, zoon van mette marit, zoon mette marit noorwegen, zustand mette marit, zoon mette marit berlijn, zoon mette marit opgepakt, zoon mette marit weer opgepakt, ziekte mette marit noorwegen, zoon mette marit leeftijd, zoon mette marit vader, zoon van mette marit door het lint, what is mette marit illness, what is mette marit, what age is mette marit, what mette marit wore, where is mette marit, mette marit house, when did mette marit and haakon meet, mette marit 2005, how did mette marit and haakon meet, how is mette marit, how is mette marit health, how is mette marit of norway, how old mette marit, how sick is mette marit, how is princess mette marit, how tall is mette marit, har mette marit utdannelse, why is mette marit on oxygen, why is mette marit sick, mette marit gwyneth paltrow, mette marit curtsy, who was mette marit first husband, who was mette marit before, who is mette marit's husband, who is princess mette marit, who is princess mette marit of norway, wikipedia mette marit, is mette-marit a smoker, is mette marit, is mette marit in hospital, is mette marit norwegian, is mette marit a princess, can mette marit become queen, can mette marit be queen after this, can mette marit still be queen, mette marit casanova, cathrine knudsen mette marit, mette marit should not be queen, mette marit shopping, mette marit outfit, mette marit shaman durek, will mette marit be queen, will mette marit get a lung transplant, will mette marit step down, how long will mette marit live, vil mette marit bli dronning, will west and mette linturi, does mette-marit smoke, does mette marit need a lung transplant, does mette marit dye her hair, does mette marit speak english, why does mette marit have pulmonary fibrosis, what does mette marit have, what illness does mette marit have, does crown princess mette marit smoke, what lung disease does mette marit have, how many kids does mette marit have, was mette-marit a smoker, was mette marit, was ist mit mette marit los, mette marit og marius, mette marit best looks, mette marits bestevenninne, mette marit beste antrekk, mette marit bestemor, top mette marit tykk, top mette marit look alike, top mette marit tjukk, top mette marit makeup, top mette marit beste antrekk, top mette marit tv show, top mette marit t skjorte, top mette marit garderobe, top mette marit nettavisen, top mette marit closet, epstein barr virus, epstein barr, epstein barr virus norsk, epstein død, epsteins perler, epstein virus, epstein files, epstein kommisjon, epstein barr virus symptomer, epstein-filene, epstein arving, epstein avskjedsbrev, ebstein anomali, epstein arv, ebstein anomaly, epstein andrew, epstein arrestert, epstein alder, epstein arving dagbladet, epstein arm tattoo, epstein barr virus kyssesyke, epstein barr virus ms, epstein barr virus kreft, epstein beatles, epstein barr virus utslett, epstein barr virus smitte, epstein clicker, epstein clicker game, epstein cellmate, epstein costume, epstein cube, epstein children, epstein conviction, epstein clinton painting, epstein corpse, epstein case, epstein dom, epstein drive, epstein dømt, epstein danmark, epstein dame, epstein dokumentar, epstein dømt 2008, epstein dokumentar nrk, epstein dom fra 2008, epstein edward, epstein email website, epstein e post, epstein exposed, epstein emails, epstein ex wife, epstein ellen degeneres, epstein edit, epstein elton john, epstein explains einstein, epstein files gov, epstein files pdf, epstein files doj, epstein files library, epstein fengsel, epstein fakta, epstein files release, epstein funeral, epstein files download, epstein granskning, epstein gransking, epstein granskningskommisjon, epstein granskning norge, epstein gov, epstein gransking stortinget, epstein genser, epstein gmail interface, epstein game, epstein grave, epstein hus, epstein høring, epstein høyde, epstein håkon, epstein høring stortinget, epstein høring utsatt, epstein hvordan døde han, epstein hva gjorde han, epstein height, epstein hoodie, epstein island minecraft schematic, epstein i norge, epstein island minecraft, epstein island google maps, epstein island building, epstein icarly, epstein island map, epstein island movie, epstein island name, epstein interview, epstein jeffrey, epstein justice, epstein juul, epstein jagland, epstein jail, epstein jerky, epstein jumper, epstein jokes, epstein jmail, epstein jacket, epstein kommisjon medlemmer, epstein kronprins haakon, epstein kommisjon norge, epstein komite norge, epstein kommisjon mandat, epstein kronprinsparet, epstein kjæreste, epstein komisjon, epstein kone, epstein library, epstein library search, epstein letter, epstein list, epstein lik, epstein latest, epstein look alike, epstein last photo, epstein lawyer, epstein law and order episode, epstein mona juul, epstein mette marit, epstein martin, epstein meme, epstein mug photo, epstein mette, epstein mansion, epstein money, epstein minecraft skin, epstein norsk politiker, epstein nyheter, epstein nrk, epstein norsk statsminister, epstein navn, epstein norge, epstein norske kontakter, epstein norske politikere, epstein news, epstein norway, epstein og mette marit, epstein ofre, epstein offer, epstein og mona juul, epstein og oljefondet, epstein offer død, epstein og kronprins håkon, epstein og prins andrew, epstein oppvekst, epstein og norske politikere, epstein perler, epstein pearls, epstein perler baby, epstein prince andrew, epstein phonk, epstein pearls baby, epstein prins andrew, epstein pronunciation, epstein pete, epstein png, epstein quarter zip, epstein quotes, epstein quarter zip aliexpress, epstein quiz, epstein qz, epstein queen elizabeth, epstein russebuss, epstein rød larsen, epstein rød larsen arv, epstein religion, epstein russland, epstein ranch new mexico, epstein ranch, epstein rooms, epstein reddit, epstein range, epstein saken, epstein salt, epstein syndrom, epstein selvmordsbrev, epstein sverige, epstein school, epstein svensk prinsesse, epstein saken oppsummert, epstein skandale norge, epstein saken mette marit, epstein testament, epstein testament rød larsen, epstein testament terje rød larsen, epstein terje rød larsen, epstein trump, epstein temple minecraft, epstein temple, epstein twin brother, epstein townhouse nyc, epstein t shirt, epstein utvalg, epstein uttale, epstein ung bilder, epstein ung, epstein university, epstein usa, epstein uwu, epstein und trump statue, epstein un, epstein und mette marit, epstein virus symptoms, epstein vg, epstein vance, epstein vs palm beach pete, epstein vs diddy, epstein victims, epstein virginia, epstein voice, epstein video files, epstein will, epstein wife, epstein wiki, epstein with kids, epstein wallpaper, epstein weinstein, epstein wef, epstein word meaning, epstein workout split, epstein will and testament, epstein xrp, epstein x diddy, epstein xbox live, epstein xbox ban, epstein xenia, epstein xbox live ban, epstein xbox account, epstein xbox, epstein young, epstein yacht, epstein yrke, epstein youth, epstein youtube, epstein yt channel name, epstein youtube news, epstein young pictures, epstein y mette marit, epstein zip, epstein zip hoodie, epstein zin, epstein zuckerman, epstein zeta function, epstein zin utility, epstein zorro ranch, epstein zodiac, epstein zelenszkij, are the epstein files released, andrew prince epstein, about epstein files, about jeffrey epstein files, about jeffrey epstein, about epstein island, about epstein news, are trump and epstein, a justice gov epstein, a caso epstein, brian epstein, barr epstein, barr epstein virus, bondi pam epstein, bill clinton epstein, bill clinton epstein files, birthday book jeffrey epstein, book about epstein, birthday book epstein, bill gates and epstein, clinton hillary epstein, chomsky epstein, clinton epstein, charlie kirk epstein, chelsea handler epstein, chris tucker epstein, can i read the epstein files, chomsky noam epstein, clinton bill epstein, caso epstein o que é, doj epstein files, department of justice us epstein files, donald trump epstein, doj epstein, deepak chopra epstein, dossier epstein, donald trump epstein files, documents epstein, death of epstein, death of jeffrey epstein, epstein mette marit epstein, emails epstein, epstein epstein files, epstein files jeffrey epstein, epstein jeffrey epstein, epstein epstein news, epstein trump epstein, epstein library epstein library, en justice gov epstein, epstein files epstein library, files epstein pdf, files epstein gov, file epstein, files epstein search, files epstein released, files jeffrey epstein, files epstein trump, files update epstein, from epstein island, files epstein pdf 2026, gabby epstein, gov epstein, gov epstein files, gov justice epstein files, gov justice epstein, gamejolt five nights at epstein's, gates epstein, geoffrey and epstein, gates epstein melinda, gmail jeffrey epstein, how to search epstein files, how epstein files released, how did epstein die, how did jeffrey epstein die, how to epstein files, how is jeffrey epstein, how much was epstein island, how did epstein do, how trump epstein, how is epstein barr, israel epstein, is epstein barr, is brian epstein, is epstein files released, in the epstein files, is jeffrey epstein dead, is jeffrey epstein, is mark epstein, is trump in the epstein files, island epstein, justice gov epstein, justice gov epstein files, jake epstein, justice epstein, jeffrey epstein files pdf doj, jeffrey epstein, jeffrey epstein quarter zip, jeffrey epstein net worth, justice department epstein files, jeffrey epstein files, kalama epstein, kenny epstein, keir starmer epstein, kevin spacey epstein, katherine keating epstein, kash patel epstein, kash patel epstein files, kto to jest epstein, kim jest epstein, karen mulder epstein, library epstein, library epstein files, latest epstein files, lifetouch epstein files, leaked epstein files, l affaire epstein, leonardo dicaprio epstein, liste epstein, list of epstein names, list of epstein files, mette marit epstein, mette marit og epstein, mark epstein, mitch epstein, melania trump epstein, melania epstein, mandelson epstein, meghan markle epstein, musk epstein, michael jackson epstein files, new epstein files, noam chomsky epstein, new epstein files released, naomi campbell epstein, names in epstein files, noam chomsky epstein files, news epstein, news epstein files, new epstein photos, net worth of epstein, o que é epstein, on the epstein files, o que é o caso epstein, oprah epstein, on redacted epstein files, of justice epstein, of epstein files released, on which date epstein files release, of epstein victims, on the epstein list, pauline epstein, p epstein barr virus, pdf epstein files, pronunciation of epstein, perlas de epstein, prince andrew epstein, pam bondi epstein, pam bondi epstein files, p epstein barr virus norsk, p epstein barr virus ebv vca igg, queenie epstein, que es epstein barr, quarter zip epstein, queen epstein, que son los archivos epstein, que es la lista epstein, quien es jeffrey epstein, qu est ce que l'affaire epstein, quando epstein morreu, quien es epstein, range david epstein, released epstein files pdf, released epstein files, redacted epstein files, richard branson epstein, read epstein files, release epstein, religion epstein, reddit epstein, release of jeffrey epstein files, search epstein files, search epstein library, search full epstein library, seymour g epstein, senate vote on epstein files, symptoms of epstein barr virus, sarah ferguson epstein, steve bannon epstein, survivors of epstein, summary of epstein files, the epstein files pdf, the epstein library, the epstein barr, the epstein files doj, trump epstein, the epstein files, the epstein files released, the epstein files search, trump epstein files, the epstein files release, us department of justice epstein files, us department of justice epstein, us department of justice epstein library, uncovered epstein files, unredacted epstein files, us government epstein files, us epstein files, usa epstein, unabomber epstein, us doj epstein files, virus epstein barr, virus epstein, vote on epstein files, virus epstein barr ebv, virginia epstein, victims of epstein press conference, victims of epstein, victims of jeffrey epstein, vote on epstein files results, vote in house on epstein files, who is epstein barr, www justice gov epstein files, who is brian epstein, www justice gov epstein, what to search in the epstein files, what is epstein library, what are the epstein files, what is epstein files pdf, were the epstein files released, who is mark epstein, xander epstein, x trump epstein, xbox jeffrey epstein, x elon musk epstein, x jeffrey epstein, xbox epstein, xbox live jeffrey epstein, xbox ban epstein, x epstein files, yona epstein roth, youtube epstein, youtube epstein files, youtube jeffrey epstein, young jeffrey epstein, young epstein, year epstein died, year of epstein files, young jeffrey epstein photos, you still talking about jeffrey epstein, what epstein barr virus, what epstein files pdf, what epstein files to look up, what epstein files, what epstein barr virus cause, what epstein files have been released, what epstein files have not been released, what epstein files pdf 2026, what epstein files means, what epstein files have been released to the public, where epstein files are released, where epstein files available, where epstein lived, where epstein island located, where epstein island, where epstein files released, where epstein files, where epstein files sealed, who got epstein's money, where epstein right now, when epstein files released, when epstein files will be released, when epstein files release, when epstein vote, when epstein files vote, when epstein files, when epstein files happened, when epstein died, when epstein birthday, how epstein died, how epstein was caught, how epstein barr virus spread, epstein's lawyer died, how epstein files, how epstein files discovered, how epstein files found, why epstein files released, why epstein files were released, why epstein files released now, why epstein files, why epstein files are important, why epstein files are so important, why epstein died, why epstein files are not fully released, why haven't the epstein files been released, who epstein files, who epstein barr, who epstein barr virus, who's epstein net worth, who's epstein's lawyer, who epstein files released, who's epstein's brother, who epstein files list, who epstein list, is epstein dead, is epstein really dead, is epstein island for sale, is epstein german, is epstein a common surname, is epstein barr virus herpes, is epstein death, is epstein island still active, is epstein island in the us, can epstein-barr cause high crp levels, can epstein barr cause migraines, can epstein barr cause neuropathy, can epstein barr be cured, can epstein barr cause cancer, can epstein barr flare up, can epstein barr virus cause cancer, can epstein barr virus be cured, can epstein barr come back, should epstein files be released, should epstein files be released poll, should epstein files be released reddit, how should epstein be pronounced, how long should epstein pearls last, should the epstein files be redacted, will epstein baseball, will epstein barr virus kill you, will epstein barr go away, will epstein files be released, will epstein files ever be fully released, will epstein victims ever get justice, will epstein survivors testify, will epstein files be released unredacted, will epstein bill pass senate, do epstein pearls hurt, do epstein pearls hurt babies, do epstein pearls pop, do epstein pearls go away, do epstein pearls mean teething, do epstein pearls feel like teeth, do epstein files, do epstein files release, why do the epstein files exist, epstein do, does epstein have kids, does epstein barr virus go away, does epstein have a brother, does epstein have siblings, does epstein have a daughter, epstein dødsårsak, was epstein a teacher, was epstein buried, was epstein in jail, was epstein a democrat, was epstein married, was epstein a physicist, was epstein a billionaire, was epstein in the military, was epstein lithuania, was epstein a doctor, best epstein barr doctors, best epstein podcast, best epstein files to read, best epstein files, best epstein documentary, best epstein files podcast, best epstein quotes, best epstein documentary reddit, best epstein files to look at, best epstein photos, top epstein associates, top epstein files, top epstein news, top epstein podcast, top epstein files findings, top epstein files to read, top epstein revelations, top epstein file, top epstein list,open source intelligence Europe, digital etterforskning Norden, faktasjekk Norge, faktakoll Sverige, kildekritikk, DOJ dokumentanalyse, unsealed court records, mahkeme belgesi analizi, açık kaynak istihbarat Türkiye, sahte haber analizi Türkiye, Epstein rettsdokumenter, Nordic investigative journalism, digital forensics Scandinavia, misinformasjon, desinformasjon, verifiserte fakta
";

function setMetaTag(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function useSEO(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    setMetaTag("name", "description", description);
    setMetaTag("name", "keywords", SEO_KEYWORDS);
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);
  }, [title, description]);
}

const App = () => {
  // ✅ Sadece Kamu Görünümü View'ları Kaldı
  const [view, setView] = useState<"home" | "post">("home");
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const activePost = useMemo(
    () => posts.find((p) => p.id === activePostId) ?? null,
    [posts, activePostId]
  );

  const loadPosts = async () => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select("id,title,author,content,date,files")
        .order("id", { ascending: false });

      if (data) {
        const mapped: Post[] = data.map((row: any) => ({
          id: Number(row.id),
          title: row.title,
          author: row.author ?? "NorthByte Analyst",
          content: row.content ?? "",
          date: toDateYMD(row.date),
          files: Array.isArray(row.files) ? row.files : [],
        }));
        setPosts(mapped);
      }
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => { loadPosts(); }, []);

  useSEO(
    view === "post" && activePost
      ? `${activePost.title} | Nordic FactShield`
      : "Nordic FactShield | Uavhengig OSINT-arkiv – Norge, Sverige, Danmark, Europa",
    view === "post" && activePost
      ? excerpt(`Kilde: Offentlige/DOJ-dokumenter. ${activePost.content}`, 160)
      : "Uavhengig OSINT og digital etterforskning basert på verifiserbare data og offentlige dokumenter, inkludert DOJ-kilder. For Norge, Sverige, Danmark, Europa og Tyrkia."
  );

  /**
   * =========================
   * RENDER HOME (Liste)
   * =========================
   */
  const renderHome = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4 border-b border-[#333] pb-2">
        <Database size={18} className="text-osint-green" />
        <h2 className="text-lg font-mono text-white uppercase tracking-widest">Global Intelligence Archive</h2>
      </div>
      {loadingPosts ? (
        <div className="p-8 text-center text-osint-muted font-mono animate-pulse">Synchronizing records...</div>
      ) : posts.length === 0 ? (
        <div className="p-8 text-center text-osint-muted font-mono">Archive is currently empty.</div>
      ) : (
        posts.map((post) => (
          <article key={post.id} className="bg-osint-card border border-[#333] rounded-lg p-6 shadow-lg hover:border-osint-green transition-all">
            <h2 className="text-2xl font-mono text-white mb-2 cursor-pointer hover:text-osint-green"
              onClick={() => { setActivePostId(post.id); setView("post"); }}>
              {post.title}
            </h2>
            <div className="text-xs text-osint-muted mb-4 font-mono uppercase">
              <span className="mr-4">Date: {post.date}</span>
              <span>Analyst: {post.author}</span>
            </div>
            <p className="text-osint-text mb-6 font-sans whitespace-pre-wrap">{excerpt(post.content, 420)}</p>
            <button onClick={() => { setActivePostId(post.id); setView("post"); }}
              className="inline-flex items-center text-osint-green border border-osint-green px-4 py-2 rounded hover:bg-osint-green hover:text-black font-mono font-bold transition-all text-xs">
              ACCESS FULL DATA
            </button>
          </article>
        ))
      )}
    </div>
  );

  /**
   * =========================
   * RENDER POST DETAIL (Detay)
   * =========================
   */
  const renderPostDetail = () => {
    if (!activePost) return null;
    return (
      <div className="bg-osint-card border border-[#333] rounded-lg p-8 shadow-xl animate-fade-in">
        <button onClick={() => setView("home")} className="mb-6 flex items-center text-osint-green hover:underline font-mono text-xs">
          <ChevronLeft size={14} className="mr-1" /> RETURN TO INDEX
        </button>
        <h1 className="text-3xl font-mono text-white mb-2 border-b border-osint-green pb-4 tracking-tighter uppercase">{activePost.title}</h1>
        <div className="text-[10px] text-osint-muted mb-8 font-mono uppercase tracking-widest flex gap-4">
          <span>Record: #{activePost.id}</span>
          <span>Date: {activePost.date}</span>
          <span>Analyst: {activePost.author}</span>
        </div>
        <div className="prose prose-invert max-w-none font-sans whitespace-pre-wrap text-lg leading-relaxed text-[#ccc] mb-8">{activePost.content}</div>
        {activePost.files.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#333]">
            <h3 className="text-white font-mono text-sm mb-4 uppercase tracking-widest text-osint-green">Evidence Files</h3>
            <ul className="space-y-2">
              {activePost.files.map((file, idx) => (
                <li key={idx} className="flex items-center text-osint-green font-mono text-xs opacity-80"><Paperclip size={14} className="mr-2" /> {file}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] font-sans selection:bg-osint-green selection:text-black">
      <header className="border-b border-[#333] py-10 text-center bg-[#111]">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-mono text-white mb-2 tracking-tighter cursor-pointer" onClick={() => setView("home")}>
            NordicFact<span className="text-osint-green">Shield.Norway</span>.no
          </h1>
          <p className="text-osint-muted text-lg font-light">Nordic FactShield is an independent, non-partisan OSINT and digital investigation initiative.

We are not affiliated with any government, intelligence agency, political organization, or media institution.

Our work is based on open-source intelligence, data analysis, and transparent methodologies.We analyze high-profile cases, including the Epstein network, using verifiable data and open-source intelligence. 

Being mentioned in investigative documents does not equate to criminal involvement. Our work focuses on separating verified facts from speculation, misinformation, and narrative distortion.</p>
          
          <nav className="mt-8 flex justify-center space-x-8 text-xs font-mono tracking-[0.2em]">
            <button onClick={() => setView("home")} className={`pb-1 transition-all ${view === "home" ? "text-white border-b border-white" : "text-osint-muted hover:text-white"}`}>
              HOME
            </button>

            {/* ✅ YENI: Integrity Arşivine Geçiş Linki */}
            <a href="/uskyld-analyse.html" className="text-[#d4af37] hover:text-white transition-all pb-1 border-b border-transparent hover:border-white">
              USKYLD ANALYSE
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-grow container max-w-4xl mx-auto px-6 py-12">
        {view === "home" && renderHome()}
        {view === "post" && renderPostDetail()}
      </main>

      <footer className="border-t border-[#333] py-10 text-center bg-[#0d0d0d]">
        <ShieldCheck size={24} className="mx-auto text-osint-muted mb-4 opacity-30" />
        <p className="text-osint-muted font-mono text-[10px] uppercase tracking-[0.3em]">&copy; 2026 FactShield.no | Sealed Intelligence</p>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
