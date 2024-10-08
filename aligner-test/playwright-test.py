from playwright.sync_api import sync_playwright
import time, os, sys

screenshot_cntr = 0
finished = False
COLLECTION_NAME = "test"
LOG_ALIG_DONE = "Alignment done!"
LOG_MARKER = "[AA]"


def do_screenshot(fullscreen=True):
    global screenshot_cntr
    page.screenshot(
        path=f"/src/data/out/{sys.argv[3]}/screenshot-{screenshot_cntr:02}.png",
        full_page=fullscreen,
    )
    screenshot_cntr += 1


def upload_files(page, html_id, files):
    with page.expect_file_chooser() as fc_info:
        page.locator(html_id).click()
    file_chooser = fc_info.value
    file_chooser.set_files(files)


def log_handler(msg, logs):
    global finished
    if LOG_MARKER in msg:
        logs.append(msg)
    if LOG_ALIG_DONE in msg:
        finished = True
    print(msg)
    sys.stdout.flush()


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=True,
        args=["--enable-features=SharedArrayBuffer"],
    )
    context = browser.new_context(
        ignore_https_errors=True,
        extra_http_headers={
            "Access-Control-Allow-Origin": "*",
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "require-corp",
        },
    )

    print("Args:", sys.argv)
    orig_folder = sys.argv[1]
    transl_folder = sys.argv[2]
    out_dir = sys.argv[3]
    split_orig = "split_orig" in sys.argv
    split_transl = "split_transl" in sys.argv

    page = context.new_page()
    print("Browser version:", browser.version)

    cdp_client = context.new_cdp_session(page)
    cdp_client.send(
        "Storage.overrideQuotaForOrigin",
        {"origin": "http://localhost:4200", "quotaSize": 1024 * 1024 * 1024 * 4},
    )

    logs = []
    page.on("console", lambda msg: log_handler(msg.text, logs))
    page.on("pageerror", lambda msg: log_handler(msg.message, logs))

    page.goto("http://localhost:4200/index.html")
    page.wait_for_load_state("load")

    do_screenshot()

    page.locator("#import-button").click()
    page.wait_for_load_state("load")

    upload_files(
        page,
        "#upload-images-orig",
        sorted(
            [
                f"/src/data/{orig_folder}/{file}"
                for file in os.listdir(f"/src/data/{orig_folder}")
            ]
        ),
    )
    upload_files(
        page,
        "#upload-images-transl",
        sorted(
            [
                f"/src/data/{transl_folder}/{file}"
                for file in os.listdir(f"/src/data/{transl_folder}")
            ]
        ),
    )

    if not split_orig:
        page.locator("#do-split-orig").click(force=True)
    if not split_transl:
        page.locator("#do-split-transl").click(force=True)

    page.locator("#collection-name").fill(COLLECTION_NAME)

    do_screenshot()

    start_time = time.time()
    page.locator("#start-import").click()

    do_screenshot()

    page.wait_for_url(f"**/read/{COLLECTION_NAME}", wait_until="load")
    do_screenshot()
    page.wait_for_timeout(1000)

    do_screenshot()

    while not finished:
        page.wait_for_timeout(1000)

    storage_usage = page.evaluate(
        """async () => {
  const storage_stats = await navigator.storage.estimate();
  return storage_stats.usageDetails.indexedDB;
}"""
    )

    print(
        f"Alignment finished in {time.time()-start_time} seconds, with {storage_usage} bytes used in indexedDB!"
    )

    logs = sorted(logs)
    with open(f"/src/data/out/{out_dir}/alignment-out.txt", "w") as f:
        f.write("\n".join(logs))

    page.mouse.click(100, 100)
    page.wait_for_timeout(1000)

    do_screenshot(False)
