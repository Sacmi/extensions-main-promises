import {
    Button,
    NavigationButton,
    RequestManager,
    SourceStateManager,
} from "paperback-extensions-common";
import { retrieveStateData, setStateData, getHchanUrl } from "./Common";

/* Helper functions */

export const testServerSettings = async (
    stateManager: SourceStateManager,
    requestManager: RequestManager
): Promise<string> => {
    // Try to establish a connection with the server. Return an human readable string containing the test result

    const hchanUrl = await getHchanUrl(stateManager);

    // We check credentials are set in server settings
    if (hchanUrl === null) {
        return "Impossible: Unset server settings";
    }

    // To test these information, we try to make a connection to the server
    // We could use a better endpoint to test the connection
    const request = createRequestObject({
        url: hchanUrl,
        method: "GET",
        incognito: true, // We don't want the authorization to be cached
    });

    let responseStatus = undefined;

    try {
        const response = await requestManager.schedule(request, 1);
        responseStatus = response.status;
    } catch (error: any) {
        // If the server is unavailable error.message will be 'AsyncOperationTimedOutError'
        return `Failed: ping "${hchanUrl}" - ${error.message}`;
    }

    switch (responseStatus) {
        case 200: {
            return "Successful connection!";
        }
        case 401: {
            return "Error 401 Unauthorized: Invalid credentials";
        }
        default: {
            return `Error ${responseStatus}`;
        }
    }
};

/* UI definition */

// NOTE: Submitted data won't be tested
export const serverSettingsMenu = (
    stateManager: SourceStateManager
): NavigationButton => {
    return createNavigationButton({
        id: "server_settings",
        value: "",
        label: "Настройки сервера",
        form: createForm({
            onSubmit: async (values: any) => setStateData(stateManager, values),
            validate: async () => true,
            sections: async () => [
                createSection({
                    id: "information",
                    header: undefined,
                    rows: async () => [
                        createMultilineLabel({
                            label: "О настройках",
                            value: "РКН может банить зеркала хентай-тян. Ниже можно изменить зеркало, чтобы получить доступ.",
                            id: "description",
                        }),
                    ],
                }),
                createSection({
                    id: "serverSettings",
                    header: "Настройка зеркала",
                    rows: async () =>
                        retrieveStateData(stateManager).then((values) => [
                            createInputField({
                                id: "serverAddress",
                                label: "URL",
                                placeholder: "https://hentaichan.live",
                                value: values.serverURL,
                                maskInput: false,
                            }),
                        ]),
                }),
                // createSection({
                //     id: "sourceOptions",
                //     header: "Source Options",
                //     footer: "",
                //     rows: async () =>
                //         retrieveStateData(stateManager).then((values) => [
                //             createSwitch({
                //                 id: "showOnDeck",
                //                 label: "Show On Deck",
                //                 value: values.showOnDeck,
                //             }),
                //             createSwitch({
                //                 id: "showContinueReading",
                //                 label: "Show Continue Reading",
                //                 value: values.showContinueReading,
                //             }),
                //             createSwitch({
                //                 id: "orderResultsAlphabetically",
                //                 label: "Sort results alphabetically",
                //                 value: values.orderResultsAlphabetically,
                //             }),
                //         ]),
                // }),
            ],
        }),
    });
};

export const testServerSettingsMenu = (
    stateManager: SourceStateManager,
    requestManager: RequestManager
): NavigationButton => {
    return createNavigationButton({
        id: "test_settings",
        value: "",
        label: "Пингануть сервер",
        form: createForm({
            onSubmit: async () => {},
            validate: async () => true,
            sections: async () => [
                createSection({
                    id: "information",
                    header: "Connection to Komga server:",
                    rows: () =>
                        testServerSettings(stateManager, requestManager).then(
                            async (value) => [
                                createLabel({
                                    label: value,
                                    value: "",
                                    id: "description",
                                }),
                            ]
                        ),
                }),
            ],
        }),
    });
};

export const resetSettingsButton = (
    stateManager: SourceStateManager
): Button => {
    return createButton({
        id: "reset",
        label: "Сбросить настройки",
        value: "",
        onTap: () => setStateData(stateManager, {}),
    });
};
