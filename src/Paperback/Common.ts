import {
    SearchRequest,
    PagedResults,
    SourceStateManager,
    RequestManager,
    Response,
    Tag,
} from "paperback-extensions-common";
import { CheerioAPI } from "cheerio";

export function getServerUnavailableMangaTiles() {
    // This tile is used as a placeholder when the server is unavailable
    return [
        createMangaTile({
            id: "placeholder-id",
            title: createIconText({ text: "Упс!" }),
            image: "",
            subtitleText: createIconText({ text: "Хентай-тян лежит :'(" }),
        }),
    ];
}

export async function searchRequest(
    searchQuery: SearchRequest,
    metadata: any,
    requestManager: RequestManager,
    stateManager: SourceStateManager,
    page_size: number
): Promise<PagedResults> {
    // This function is also called when the user search in an other source. It should not throw if the server is unavailable.

    // We won't use `await this.getKomgaAPI()` as we do not want to throw an error
    const hchanUrl = await getHchanUrl(stateManager);
    // const { orderResultsAlphabetically } = await getOptions(stateManager);

    if (hchanUrl === null) {
        console.log("searchRequest failed because server settings are unset");

        return createPagedResults({
            results: getServerUnavailableMangaTiles(),
        });
    }

    const page: number = metadata?.page ?? 0;

    const paramsList = [`page=${page}`, `size=${page_size}`];

    if (searchQuery.title !== undefined && searchQuery.title !== "") {
        paramsList.push("search=" + encodeURIComponent(searchQuery.title));
    }
    if (searchQuery.includedTags !== undefined) {
        searchQuery.includedTags.forEach((tag) => {
            // There are two types of tags: `tag` and `genre`
            if (tag.id.substr(0, 4) == "tag-") {
                paramsList.push(
                    "tag=" + encodeURIComponent(tag.id.substring(4))
                );
            }
            if (tag.id.substr(0, 6) == "genre-") {
                paramsList.push(
                    "genre=" + encodeURIComponent(tag.id.substring(6))
                );
            }
            if (tag.id.substr(0, 11) == "collection-") {
                paramsList.push(
                    "collection_id=" + encodeURIComponent(tag.id.substring(11))
                );
            }
            if (tag.id.substr(0, 8) == "library-") {
                paramsList.push(
                    "library_id=" + encodeURIComponent(tag.id.substring(8))
                );
            }
        });
    }

    // if (orderResultsAlphabetically) {
    //     paramsList.push("sort=titleSort");
    // } else {
    //     paramsList.push("sort=lastModified,desc");
    // }

    let paramsString = "";
    if (paramsList.length > 0) {
        paramsString = "?" + paramsList.join("&");
    }

    // TODO: переписать для hchan
    const request = createRequestObject({
        url: `${hchanUrl}/series`,
        method: "GET",
        param: paramsString,
    });

    // We don't want to throw if the server is unavailable
    let data: Response;
    try {
        data = await requestManager.schedule(request, 1);
    } catch (error) {
        console.log(`searchRequest failed with error: ${error}`);
        return createPagedResults({
            results: getServerUnavailableMangaTiles(),
        });
    }

    const result =
        typeof data.data === "string" ? JSON.parse(data.data) : data.data;

    const tiles = [];
    for (const serie of result.content) {
        tiles.push(
            // TODO: переписать для hchan
            createMangaTile({
                id: serie.id,
                title: createIconText({ text: serie.metadata.title }),
                image: `${hchanUrl}/series/${serie.id}/thumbnail`,
            })
        );
    }

    // If no series were returned we are on the last page
    metadata = tiles.length === 0 ? undefined : { page: page + 1 };

    return createPagedResults({
        results: tiles,
        metadata,
    });
}

//
// KOMGA API STATE METHODS
//

const DEFAULT_HCHAN_SERVER_ADDRESS = "https://hentaichan.live";
// const DEFAULT_SHOW_ON_DECK = false;
// const DEFAULT_SORT_RESULTS_ALPHABETICALLY = true;
// const DEFAULT_SHOW_CONTINUE_READING = false;

export async function getHchanUrl(
    stateManager: SourceStateManager
): Promise<string> {
    return (
        ((await stateManager.retrieve("serverAddress")) as
            | string
            | undefined) ?? DEFAULT_HCHAN_SERVER_ADDRESS
    );
}

// export async function getOptions(stateManager: SourceStateManager): Promise<{
//     showOnDeck: boolean;
//     orderResultsAlphabetically: boolean;
//     showContinueReading: boolean;
// }> {
//     const showOnDeck =
//         ((await stateManager.retrieve("showOnDeck")) as boolean) ??
//         DEFAULT_SHOW_ON_DECK;
//     const orderResultsAlphabetically =
//         ((await stateManager.retrieve(
//             "orderResultsAlphabetically"
//         )) as boolean) ?? DEFAULT_SORT_RESULTS_ALPHABETICALLY;
//     const showContinueReading =
//         ((await stateManager.retrieve("showContinueReading")) as boolean) ??
//         DEFAULT_SHOW_CONTINUE_READING;

//     return { showOnDeck, orderResultsAlphabetically, showContinueReading };
// }

export async function retrieveStateData(stateManager: SourceStateManager) {
    // Return serverURL, serverUsername and serverPassword saved in the source.
    // Used to show already saved data in settings

    const serverURL =
        ((await stateManager.retrieve("serverAddress")) as string) ??
        DEFAULT_HCHAN_SERVER_ADDRESS;
    // const showOnDeck =
    //     ((await stateManager.retrieve("showOnDeck")) as boolean) ??
    //     DEFAULT_SHOW_ON_DECK;
    // const orderResultsAlphabetically =
    //     ((await stateManager.retrieve(
    //         "orderResultsAlphabetically"
    //     )) as boolean) ?? DEFAULT_SORT_RESULTS_ALPHABETICALLY;
    // const showContinueReading =
    //     ((await stateManager.retrieve("showContinueReading")) as boolean) ??
    //     DEFAULT_SHOW_CONTINUE_READING;

    return {
        serverURL,
        // showOnDeck,
        // orderResultsAlphabetically,
        // showContinueReading,
    };
}

export async function setStateData(
    stateManager: SourceStateManager,
    data: Record<string, any>
) {
    await setHchanServerAddress(
        stateManager,
        data["serverAddress"] ?? DEFAULT_HCHAN_SERVER_ADDRESS
    );
    // await setOptions(
    //     stateManager,
    //     data["showOnDeck"] ?? DEFAULT_SHOW_ON_DECK,
    //     data["orderResultsAlphabetically"] ??
    //         DEFAULT_SORT_RESULTS_ALPHABETICALLY,
    //     data["showContinueReading"] ?? DEFAULT_SHOW_CONTINUE_READING
    // );
}

export function parseTagSection($: CheerioAPI): Tag[] {
    return $("li.sidetag")
        .toArray()
        .map((el) => {
            const tag = $("a:nth-child(3)", el).text().trim();

            return createTag({
                id: tag.replaceAll(" ", "_"),
                label: capitalize(tag),
            });
        });
}

export const capitalize = (tag: string): string => {
    return tag.replace(/^\w/, (c) => c.toUpperCase());
};

async function setHchanServerAddress(
    stateManager: SourceStateManager,
    apiUri: string
) {
    await stateManager.store("serverAddress", apiUri);
}

// async function setOptions(
//     stateManager: SourceStateManager,
//     showOnDeck: boolean,
//     orderResultsAlphabetically: boolean,
//     showContinueReading: boolean
// ) {
//     await stateManager.store("showOnDeck", showOnDeck);
//     await stateManager.store(
//         "orderResultsAlphabetically",
//         orderResultsAlphabetically
//     );
//     await stateManager.store("showContinueReading", showContinueReading);
// }
