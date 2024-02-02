import {
    Chapter,
    ChapterDetails,
    ContentRating,
    HomeSection,
    LanguageCode,
    Manga,
    MangaStatus,
    MangaTile,
    MangaUpdates,
    PagedResults,
    // Request,
    // RequestInterceptor,
    SearchRequest,
    Section,
    Source,
    SourceInfo,
    // SourceStateManager,
    TagSection,
    TagType,
} from "paperback-extensions-common";

import { parseLangCode } from "./Languages";

import {
    resetSettingsButton,
    serverSettingsMenu,
    testServerSettingsMenu,
} from "./Settings";

import {
    capitalize,
    getHchanUrl,
    getServerUnavailableMangaTiles,
    parseTagSection,
    searchRequest,
} from "./Common";

// This source use Komga REST API
// https://komga.org/guides/rest.html

// Manga are represented by `series`
// Chapters are represented by `books`

// The Basic Authentication is handled by the interceptor

// Code and method used by both the source and the tracker are defined in the duplicated `KomgaCommon.ts` file

// Due to the self hosted nature of Komga, this source requires the user to enter its server credentials in the source settings menu
// Some methods are known to throw errors without specific actions from the user. They try to prevent this behavior when server settings are not set.
// This include:
//  - homepage sections
//  - getTags() which is called on the homepage
//  - search method which is called even if the user search in an other source

export const PaperbackInfo: SourceInfo = {
    version: "0.0.1",
    name: "Хентай-тян",
    icon: "icon.png",
    author: "NN",
    authorWebsite: "https://github.com/FramboisePi",
    description: "Клиент для Хентай-тян",
    contentRating: ContentRating.ADULT,
    websiteBaseURL: "https://hentaichan.live/",
    sourceTags: [
        {
            text: "Обычно лежит как сука",
            type: TagType.RED,
        },
    ],
};

const SUPPORTED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
];

// Number of items requested for paged requests
const PAGE_SIZE = 40;

export class Paperback extends Source {
    stateManager = createSourceStateManager({});

    requestManager = createRequestManager({
        requestsPerSecond: 4,
        requestTimeout: 35000,
    });

    override async getSourceMenu(): Promise<Section> {
        return createSection({
            id: "main",
            header: "Настройки Хентай-тян",
            rows: async () => [
                serverSettingsMenu(this.stateManager),
                testServerSettingsMenu(this.stateManager, this.requestManager),
                resetSettingsButton(this.stateManager),
            ],
        });
    }

    override async supportsTagExclusion(): Promise<boolean> {
        return true;
    }

    override getMangaShareUrl(mangaId: string): string {
        return `https://hentaichan.live/manga/${mangaId}.html`;
    }

    override async getSearchTags(): Promise<TagSection[]> {
        // This function is called on the homepage and should not throw if the server is unavailable

        // We define four types of tags:
        // - `genre`
        // - `tag`
        // - `collection`
        // - `library`
        // To be able to make the difference between theses types, we append `genre-` or `tag-` at the beginning of the tag id

        // let response: Response;

        // We try to make the requests. If this fail, we return a placeholder tags list to inform the user and prevent the function from throwing an error
        // try {
        //     const hchanUrl = await getHchanUrl(this.stateManager);

        //     const request = createRequestObject({
        //         url: `${hchanUrl}/manga`,
        //         method: "GET",
        //     });
        //     response = await this.requestManager.schedule(request, 1);
        // } catch (error) {
        //     console.error(`getTags failed with error: ${error}`);
        //     return [
        //         createTagSection({
        //             id: "-1",
        //             label: "Server unavailable",
        //             tags: [],
        //         }),
        //     ];
        // }

        // The following part of the function should throw if there is an error and thus is not in the try/catch block
        // const $ = this.cheerio.load(response.data);
        // const parsedTags = $("li.sidetag")
        //     .toArray()
        //     .map((el) => $("a:nth-child(3)", el).text().trim());

        const tagSection = createTagSection({
            id: "0",
            label: "Тэги",
            tags: [],
        });

        // уже полученные теги. получать новые слишком долго
        const parsedTags = [
            "3D",
            "3DCG",
            "ahegao",
            "foot fetish",
            "footfuck",
            "lolcon",
            "megane",
            "mind break",
            "monstergirl",
            "paizuri (titsfuck)",
            "x-ray",
            "алкоголь",
            "анал",
            "анилингус",
            "без текста",
            "без трусиков",
            "без цензуры",
            "беременность",
            "бикини",
            "большая грудь",
            "большие попки",
            "в общественном месте",
            "в первый раз",
            "в цвете",
            "в школе",
            "веб",
            "волосатые женщины",
            "гаремник",
            "гг девушка",
            "гг парень",
            "гипноз",
            "глубокий минет",
            "групповой секс",
            "гяру и гангуро",
            "двойное проникновение",
            "демоны",
            "дилдо",
            "драма",
            "за деньги",
            "зрелые женщины",
            "измена",
            "изнасилование",
            "инопланетяне",
            "исполнение желаний",
            "камера",
            "кимоно",
            "колготки",
            "комиксы",
            "косплей",
            "кремпай",
            "куннилингус",
            "маленькая грудь",
            "мастурбация",
            "минет",
            "молоко",
            "монстры",
            "мужчина крепкого телосложения",
            "мускулистые женщины",
            "на природе",
            "обычный секс",
            "огромная грудь",
            "огромный член",
            "оплодотворение",
            "остановка времени",
            "парень пассив",
            "пляж",
            "подглядывание",
            "подчинение",
            "презерватив",
            "принуждение",
            "прозрачная одежда",
            "проникновение в матку",
            "психические отклонения",
            "рабыни",
            "романтика",
            "секс игрушки",
            "сетакон",
            "скрытный секс",
            "страпон",
            "суккубы",
            "темнокожие",
            "тентакли",
            "трап",
            "умеренная жестокость",
            "учитель и ученик",
            "ушастые",
            "фантастика",
            "фемдом",
            "фетиш",
            "фурри",
            "футанари",
            "фэнтези",
            "чулки",
            "школьная форма",
            "школьники",
            "школьницы",
            "школьный купальник",
            "эччи",
            "юмор",
            "юри",
            "яой",
        ];

        // For each tag, we append a type identifier to its id and capitalize its label
        tagSection.tags = parsedTags.map((elem: string) =>
            createTag({
                id: elem.replaceAll(" ", "_"),
                label: capitalize(elem),
            })
        );

        return [tagSection];
    }

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const hchanUrl = await getHchanUrl(this.stateManager);

        const request = createRequestObject({
            url: `${hchanUrl}/manga/${mangaId}.html`,
            method: "GET",
        });

        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);

        const tagSection = createTagSection({
            id: "0",
            label: "Тэги",
            tags: [],
        });
        tagSection.tags = parseTagSection($);

        const authors: string[] = [];
        const artists: string[] = [];

        const infoEl = $("#info_wrap");
        const title = $("div:nth-child(1) > div > h1 > a", infoEl)
            .text()
            .trim();

        $("div.row", infoEl)
            .toArray()
            .forEach((el) => {
                const label = $("div.item", el).text().trim();
                const value = $("div.item2", el).text().trim();

                switch (label) {
                    case "Автор":
                        authors.push(value);
                        break;
                    case "Переводчик":
                        artists.push(value);
                        break;
                    case "Аниме/манга":
                    case "Язык":
                        break;
                }
            });

        let views, follows: number | undefined;

        const stats = $("div.row5", infoEl).text().split(",");
        if (stats.length == 3) {
            const viewsStat = stats[0]!!.split(": ").pop();
            if (viewsStat) {
                views = parseInt(viewsStat);
            }

            const downloadsStat = stats[1]!!.split(": ").pop();
            if (downloadsStat) {
                follows = parseInt(downloadsStat);
            }
        }

        const image = $("#cover").attr("src") || "";
        const desc = $("#description").text().trim();

        return createManga({
            id: mangaId,
            titles: [title],
            image,
            status: MangaStatus.UNKNOWN,
            langFlag: LanguageCode.RUSSIAN,
            // Unused: langName

            artist: artists.join(", "),
            author: authors.join(", "),

            desc: desc.length === 0 ? undefined : desc,
            tags: [tagSection],
            // TODO: распарсить дату
            // lastUpdate: metadata.lastModified,

            views,
            follows,
            hentai: true,
        });
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {
        /*
                In Komga a chapter is a `book`
                */

        const komgaAPI = await getHchanUrl(this.stateManager);

        const booksRequest = createRequestObject({
            url: `${komgaAPI}/series/${mangaId}/books`,
            param: "?unpaged=true&media_status=READY&deleted=false",
            method: "GET",
        });

        const booksResponse = await this.requestManager.schedule(
            booksRequest,
            1
        );
        const booksResult =
            typeof booksResponse.data === "string"
                ? JSON.parse(booksResponse.data)
                : booksResponse.data;

        const chapters: Chapter[] = [];

        // Chapters language is only available on the serie page
        const serieRequest = createRequestObject({
            url: `${komgaAPI}/series/${mangaId}`,
            method: "GET",
        });
        const serieResponse = await this.requestManager.schedule(
            serieRequest,
            1
        );
        const serieResult =
            typeof serieResponse.data === "string"
                ? JSON.parse(serieResponse.data)
                : serieResponse.data;
        const languageCode = parseLangCode(serieResult.metadata.language);

        for (const book of booksResult.content) {
            chapters.push(
                createChapter({
                    id: book.id,
                    mangaId: mangaId,
                    chapNum: parseFloat(book.metadata.number),
                    langCode: languageCode,
                    name: `${book.metadata.title} (${book.size})`,
                    time: new Date(book.fileLastModified),
                    // @ts-ignore
                    sortingIndex: book.metadata.numberSort,
                })
            );
        }

        return chapters;
    }

    async getChapterDetails(
        mangaId: string,
        chapterId: string
    ): Promise<ChapterDetails> {
        const komgaAPI = await getHchanUrl(this.stateManager);

        const request = createRequestObject({
            url: `${komgaAPI}/books/${chapterId}/pages`,
            method: "GET",
        });

        const data = await this.requestManager.schedule(request, 1);
        const result =
            typeof data.data === "string" ? JSON.parse(data.data) : data.data;

        const pages: string[] = [];
        for (const page of result) {
            if (SUPPORTED_IMAGE_TYPES.includes(page.mediaType)) {
                pages.push(
                    `intercept*${komgaAPI}/books/${chapterId}/pages/${page.number}`
                );
            } else {
                pages.push(
                    `intercept*${komgaAPI}/books/${chapterId}/pages/${page.number}?convert=png`
                );
            }
        }

        // Determine the preferred reading direction which is only available in the serie metadata
        const serieRequest = createRequestObject({
            url: `${komgaAPI}/series/${mangaId}`,
            method: "GET",
        });

        const serieResponse = await this.requestManager.schedule(
            serieRequest,
            1
        );
        const serieResult =
            typeof serieResponse.data === "string"
                ? JSON.parse(serieResponse.data)
                : serieResponse.data;

        let longStrip = false;
        if (
            ["VERTICAL", "WEBTOON"].includes(
                serieResult.metadata.readingDirection
            )
        ) {
            longStrip = true;
        }

        return createChapterDetails({
            id: chapterId,
            longStrip: longStrip,
            mangaId: mangaId,
            pages: pages,
        });
    }

    override async getSearchResults(
        searchQuery: SearchRequest,
        metadata: any
    ): Promise<PagedResults> {
        // This function is also called when the user search in an other source. It should not throw if the server is unavailable.

        return searchRequest(
            searchQuery,
            metadata,
            this.requestManager,
            this.stateManager,
            PAGE_SIZE
        );
    }

    override async getHomePageSections(
        sectionCallback: (section: HomeSection) => void
    ): Promise<void> {
        // This function is called on the homepage and should not throw if the server is unavailable

        // We won't use `await this.getKomgaAPI()` as we do not want to throw an error on
        // the homepage when server settings are not set
        const hchanUrl = await getHchanUrl(this.stateManager);
        // const { showOnDeck, showContinueReading } = await getOptions(
        //     this.stateManager
        // );

        if (hchanUrl === null) {
            console.log(
                "searchRequest failed because server settings are unset"
            );
            const section = createHomeSection({
                id: "unset",
                title: "Зеркало Хентай-тян не настроено",
                view_more: false,
                items: getServerUnavailableMangaTiles(),
            });
            sectionCallback(section);
            return;
        }

        // The source define two homepage sections: new and latest
        const newSection = createHomeSection({
            id: "new",
            title: "Новая манга",
            //type: showRecentFeatured ? HomeSectionType.featured : HomeSectionType.singleRowNormal,
            view_more: false,
        });

        const promises: Promise<void>[] = [];

        // Let the app load empty tagSections
        sectionCallback(newSection);

        const request = createRequestObject({
            url: hchanUrl,
            method: "GET",
        });

        const tiles: MangaTile[] = [];

        // Get the section data
        promises.push(
            this.requestManager.schedule(request, 1).then((data) => {
                const $ = this.cheerio.load(data.data);

                const newMangaEl = $("div.area_right")
                    .toArray()
                    .find((el) => {
                        const title = $(
                            "div.area_rightSpace > span > a",
                            $(el)
                        ).text();

                        return "Новая манга" === title;
                    });

                if (newMangaEl === undefined) {
                    console.error("block with new manga not found");
                    return;
                }

                const parsedManga = $(
                    "ul.area_rightNews.linkStyle > a",
                    newMangaEl
                )
                    .toArray()
                    .map((el) => {
                        const imgEl = $("img", el);

                        const title = (el.attribs["title"] || "").trim();
                        const mangaUrl = `https:${el.attribs["href"]}` || "";
                        const previewUrl = imgEl.attr("src") || "";

                        console.log(
                            `Parsed: { ${title}, ${mangaUrl}, ${previewUrl}}`
                        );
                        return { title, mangaUrl, previewUrl };
                    });

                for (const serie of parsedManga) {
                    const { title, mangaUrl, previewUrl } = serie;

                    // ".html" = -5
                    const id = mangaUrl.split("/").pop()!!.slice(0, -5);

                    tiles.push(
                        createMangaTile({
                            id: id,
                            title: createIconText({
                                text: title,
                            }),
                            image: previewUrl,
                        })
                    );
                }
                newSection.items = tiles;
                sectionCallback(newSection);
            })
        );

        // Make sure the function completes
        await Promise.all(promises);
    }

    override async getViewMoreItems(
        homepageSectionId: string,
        metadata: any
    ): Promise<PagedResults> {
        const komgaAPI = await getHchanUrl(this.stateManager);
        const page: number = metadata?.page ?? 0;

        const request = createRequestObject({
            url: `${komgaAPI}/series/${homepageSectionId}`,
            param: `?page=${page}&size=${PAGE_SIZE}&deleted=false`,
            method: "GET",
        });

        const data = await this.requestManager.schedule(request, 1);
        const result =
            typeof data.data === "string" ? JSON.parse(data.data) : data.data;

        const tiles: MangaTile[] = [];
        for (const serie of result.content) {
            tiles.push(
                createMangaTile({
                    id: serie.id,
                    title: createIconText({ text: serie.metadata.title }),
                    image: `${komgaAPI}/series/${serie.id}/thumbnail`,
                })
            );
        }

        // If no series were returned we are on the last page
        metadata = tiles.length === 0 ? undefined : { page: page + 1 };

        return createPagedResults({
            results: tiles,
            metadata: metadata,
        });
    }
}
