#include <numeric>
#include <filesystem>
#include <fstream>
#include <deque>
#include "opencv2/opencv.hpp"

#include <emscripten/bind.h>

// #define ALIGN_DEBUG

const double EPS = 0.1;
const int PIXEL_EPS = 10;
const double RATIO_LOWER = 2 / 3 - EPS;
const double RATIO_HIGHER = 2 / 3 + EPS;
const int SEARCH_RANGE = 10;

struct PageImage
{
    int index;
    cv::Mat img;
#ifdef ALIGN_DEBUG
    cv::Mat img_kp;
#endif
    cv::Mat img_grey;
    bool previously_aligned;
};

std::deque<PageImage> origs;
std::deque<PageImage> transls;
int orig_count = 0;
int transl_count = 0;

cv::Mat last_aligned;
cv::Mat last_homography;
cv::Ptr<cv::Formatter> formatter = cv::Formatter::get(cv::Formatter::FMT_PYTHON);

#ifdef ALIGN_DEBUG
cv::Mat debug_orig;
cv::Mat debug_transl;
#endif

bool double_page(cv::Mat img)
{
    double ratio = img.cols / img.rows;
    if (RATIO_HIGHER > ratio && ratio > RATIO_LOWER)
    {
        return false;
    }
    return true;
}

cv::Mat downscale(cv::Mat &img, int target_size, bool force = false)
{
    if (target_size > 0 && (target_size < img.cols * img.rows || force))
    {
        if (double_page(img))
        {
            target_size *= 2;
        }
        int width = std::sqrt(target_size * ((float)img.cols / (float)img.rows));
        int height = target_size / width;
        cv::Mat resized;
        cv::resize(img, resized, cv::Size(width, height), 0, 0, cv::INTER_AREA);
        return resized;
    }
    return img;
}

// crops black and white image in place and returns roi
cv::Rect2i crop(cv::Mat &image)
{
    bool changed = true;
    cv::Rect2i rv(0, 0, image.cols, image.rows);
    while (changed && rv.area() > 0)
    {
        changed = false;
        uint8_t topleft = image.row(0).at<uint8_t>(0);
        uint8_t bottomright = image.row(image.rows - 1).at<uint8_t>(image.cols - 1);

        if (cv::checkRange(image.row(0), true, NULL, topleft, topleft + 1))
        {
            rv.y++;
            rv.height--;
            image = image(cv::Range(1, image.rows), cv::Range::all());
            changed = true;
        }
        else if (cv::checkRange(image.row(image.rows - 1), true, NULL, bottomright, bottomright + 1))
        {
            rv.height--;
            image = image(cv::Range(0, image.rows - 1), cv::Range::all());
            changed = true;
        }
        else if (cv::checkRange(image.col(0), true, NULL, topleft, topleft + 1))
        {
            rv.x++;
            rv.width--;
            image = image(cv::Range::all(), cv::Range(1, image.cols));
            changed = true;
        }
        else if (cv::checkRange(image.col(image.cols - 1), true, NULL, bottomright, bottomright + 1))
        {
            rv.width--;
            image = image(cv::Range::all(), cv::Range(0, image.cols - 1));
            changed = true;
        }
    }
    return rv;
}

void crop_safe(cv::Mat &img_color, cv::Mat &img_grey)
{
    cv::Rect2i roi = crop(img_grey);
    if (roi.area() > 0)
    {
        img_color = img_color(roi);
    }
    else
    {
        cv::cvtColor(img_color, img_grey, cv::COLOR_BGRA2GRAY);
    }
}

bool same_color_col(cv::Mat &img, int colnum)
{
    uint8_t top = img.col(colnum).at<uint8_t>(0);
    return cv::checkRange(img.col(colnum), true, NULL, top, top + 1);
}

int load_and_preproc(cv::Mat &img_color, cv::Mat &img_grey, std::deque<PageImage> &acc, int &acc_count, int resize, bool do_split, bool do_crop, bool right2left)
{
    if (do_crop)
    {
        crop_safe(img_color, img_grey);
    }

    if (do_split && double_page(img_grey) && (same_color_col(img_grey, img_grey.cols / 2) || same_color_col(img_grey, img_grey.cols / 2 + PIXEL_EPS) || same_color_col(img_grey, img_grey.cols / 2 - PIXEL_EPS)))
    {
        cv::Mat tmp1_grey, tmp2_grey, tmp1_color, tmp2_color;

        img_grey.copyTo(tmp1_grey);
        tmp1_grey = tmp1_grey(cv::Range::all(), cv::Range(0, tmp1_grey.cols / 2));
        tmp2_grey = img_grey(cv::Range::all(), cv::Range(img_grey.cols / 2, img_grey.cols));

        img_color.copyTo(tmp1_color);
        tmp1_color = tmp1_color(cv::Range::all(), cv::Range(0, tmp1_color.cols / 2));
        tmp2_color = img_color(cv::Range::all(), cv::Range(img_color.cols / 2, img_color.cols));

        if (do_crop)
        {
            crop_safe(tmp1_color, tmp1_grey);
            crop_safe(tmp2_color, tmp2_grey);
        }

        if (right2left)
        {
            acc.push_back({
                .index = acc_count++,
                .img = downscale(tmp2_color, resize, true),
                .img_grey = downscale(tmp2_grey, resize, true),
                .previously_aligned = false,
            });
            acc.push_back({
                .index = acc_count++,
                .img = downscale(tmp1_color, resize, true),
                .img_grey = downscale(tmp1_grey, resize, true),
                .previously_aligned = false,
            });
        }
        else
        {
            acc.push_back({
                .index = acc_count++,
                .img = downscale(tmp1_color, resize, true),
                .img_grey = downscale(tmp1_grey, resize, true),
                .previously_aligned = false,
            });
            acc.push_back({
                .index = acc_count++,
                .img = downscale(tmp2_color, resize, true),
                .img_grey = downscale(tmp2_grey, resize, true),
                .previously_aligned = false,
            });
        }

        return 2;
    }
    else
    {
        acc.push_back({
            .index = acc_count++,
            .img = downscale(img_color, resize, true),
            .img_grey = downscale(img_grey, resize, true),
            .previously_aligned = false,
        });
        return 1;
    }
}

int load_raw(int width, int height, std::deque<PageImage> &acc, int &acc_count, int resize, bool do_split, bool do_crop, bool right2left)
{
    cv::Mat img_color(height, width, CV_8UC4);
    std::ifstream ifs("/rawdata", std::ios::binary);
    ifs.read((char *)img_color.data, height * width * 4);
    cv::cvtColor(img_color, img_color, cv::COLOR_RGBA2BGRA);

    cv::Mat img_grey;
    cv::cvtColor(img_color, img_grey, cv::COLOR_BGRA2GRAY);

    return load_and_preproc(img_color, img_grey, acc, acc_count, resize, do_split, do_crop, right2left);
}

void write_im_and_info(std::string name, cv::Mat &image)
{
    cv::imwrite(name + ".png", image);

    std::ofstream infofile(name + ".txt");
    if (infofile.is_open())
    {
        infofile << image.cols << ":" << image.rows << std::endl;
        infofile.close();
    }
    else
    {
        std::cout << "[AA] Error opening image info file for write: " << name << std::endl;
    }
}

void checkHomography(int inlier_count, cv::Mat &aligim, cv::Mat &refim, cv::Mat &homography)
{
    if (inlier_count <= 10)
    {
        throw std::runtime_error("Not enough inliers!");
    }

    std::vector<cv::Point2f> alig_corners(4);
    alig_corners[0] = cv::Point2f(0, 0);
    alig_corners[1] = cv::Point2f((float)refim.cols, 0);
    alig_corners[2] = cv::Point2f((float)refim.cols, (float)refim.rows);
    alig_corners[3] = cv::Point2f(0, (float)refim.rows);
    std::vector<cv::Point2f> transformed(4);
    perspectiveTransform(alig_corners, transformed, homography);

    if (!cv::isContourConvex(transformed))
    {
        throw std::runtime_error("Transformed contour is not convex!");
    }

    double ref_area = refim.cols * refim.rows;
    double transformed_area = cv::contourArea(transformed);
    double ref_alig_ratio = ref_area / transformed_area;
    bool ref_double_page = double_page(refim);
    bool alig_double_page = double_page(aligim);

    // there can be more cases of single/double page combinations that are not really handled here and in the pairing logic; also opportunities for easy optimizations because current iteration organization is pretty wasteful. TODO for the future
    if (ref_double_page != alig_double_page)
    {
        if (ref_alig_ratio > 3.0f || ref_alig_ratio < 0.3334f)
        {
            throw std::runtime_error("Area difference is too big!");
        }
    }
    else
    {
        if (ref_alig_ratio > 1.5f || ref_alig_ratio < 0.6665f)
        {
            throw std::runtime_error("Area difference is too big!");
        }
    }
}

cv::Mat align(cv::Mat &to_align_color, cv::Mat &to_align_grey, cv::Mat &refim_color, cv::Mat &refim_grey, int orb_count = 10000)
{
    cv::Ptr<cv::ORB> orb_detector = cv::ORB::create(orb_count);
    std::vector<cv::KeyPoint> ref_keypoints, alig_keypoints;
    cv::Mat ref_descriptors, alig_descriptors;

    orb_detector->detectAndCompute(refim_grey, cv::noArray(), ref_keypoints, ref_descriptors);
    orb_detector->detectAndCompute(to_align_grey, cv::noArray(), alig_keypoints, alig_descriptors);

#ifdef ALIGN_DEBUG
    cv::drawKeypoints(to_align_color, alig_keypoints, debug_transl, cv::Scalar::all(-1), cv::DrawMatchesFlags::DRAW_RICH_KEYPOINTS);
    cv::drawKeypoints(refim_color, ref_keypoints, debug_orig, cv::Scalar::all(-1), cv::DrawMatchesFlags::DRAW_RICH_KEYPOINTS);
#endif

    if (ref_keypoints.size() == 0 || alig_keypoints.size() == 0)
    {
        throw std::runtime_error("No keypoints!");
    }

    cv::Ptr<cv::BFMatcher> matcher = cv::BFMatcher::create(cv::NormTypes::NORM_HAMMING);
    std::vector<std::vector<cv::DMatch>> knn_matches;
    matcher->knnMatch(alig_descriptors, ref_descriptors, knn_matches, 2);

    const float ratio_thresh = 0.75f;
    std::vector<cv::DMatch> good_matches;
    for (size_t i = 0; i < knn_matches.size(); ++i)
    {
        if (knn_matches[i][0].distance < ratio_thresh * knn_matches[i][1].distance)
        {
            good_matches.push_back(knn_matches[i][0]);
        }
    }

    if (good_matches.size() < 5)
    {
        throw std::runtime_error("Not enough good matches!");
    }

    std::vector<cv::Point2f> alig_matched;
    std::vector<cv::Point2f> ref_matched;
    std::vector<uchar> mask;
    for (size_t i = 0; i < good_matches.size(); i++)
    {
        alig_matched.push_back(alig_keypoints[good_matches[i].queryIdx].pt);
        ref_matched.push_back(ref_keypoints[good_matches[i].trainIdx].pt);
    }

    last_homography = cv::findHomography(alig_matched, ref_matched, mask, cv::RANSAC);
    int inlier_count = std::accumulate(mask.begin(), mask.end(), 0);

    checkHomography(inlier_count, to_align_grey, refim_grey, last_homography);
#ifdef ALIGN_DEBUG
    cv::drawKeypoints(to_align_color, alig_keypoints, to_align_color, cv::Scalar::all(-1), cv::DrawMatchesFlags::DRAW_RICH_KEYPOINTS);
#endif

    cv::Mat warped_color;
    cv::warpPerspective(to_align_color, warped_color, last_homography,
                        cv::Size(refim_color.cols, refim_color.rows), cv::INTER_LINEAR,
                        cv::BorderTypes::BORDER_CONSTANT, cv::Vec4b(0, 0, 0, 0));

    return warped_color;
}

int add_orig(std::string dst_path, int width, int height, int resize, bool do_split, bool do_crop, bool right2left)
{
    int cnt = load_raw(width, height, origs, orig_count, resize, do_split, do_crop, right2left);

    std::cout << "[AA] ORIG-" << origs.back().index << " added" << std::endl;
    write_im_and_info(std::filesystem::path(dst_path) / (std::to_string(origs.back().index + 1000001)), origs.back().img);

    if (cnt > 1)
    {
        std::cout << "[AA] ORIG-" << origs[origs.size() - 2].index << " split off previous and added" << std::endl;
        write_im_and_info(std::filesystem::path(dst_path) / (std::to_string(origs[origs.size() - 2].index + 1000001)), origs[origs.size() - 2].img);
    }
    return cnt;
}

int find_pairing(std::string dst_path, int transl_index, int orb_count)
{
    int cnt = 0;
    for (int i = 0; i < SEARCH_RANGE && i < origs.size(); ++i)
    {
        try
        {
            cv::Mat aligned = align(transls[transl_index].img, transls[transl_index].img_grey, origs[i].img, origs[i].img_grey, orb_count);
            cnt += 1;
            if (origs[i].previously_aligned)
            {
                if (i != 0)
                {
                    std::cout << "[AA] Unexpected, multioverlay at i=" << i << " ORIG-" << origs[i].index << " / TRANSL-" << transls[transl_index].index << std::endl;
                }
                cv::add(last_aligned, aligned, last_aligned);
                std::cout << "[AA] TRANSL-" << transls[transl_index].index << " additionally overlaid onto ORIG-" << origs[i].index << " // homography: " << formatter->format(last_homography) << std::endl;
            }
            else
            {
                last_aligned = aligned;
                std::cout << "[AA] TRANSL-" << transls[transl_index].index << " primarily overlaid onto ORIG-" << origs[i].index << " // homography: " << formatter->format(last_homography) << std::endl;
            }
            origs[i].previously_aligned = true;
            write_im_and_info(std::filesystem::path(dst_path) / (std::to_string(origs[i].index + 1000001)), last_aligned);

            for (int bt_orig_index = i - 1, bt_transl_index = transl_index - 1;
                 0 <= bt_orig_index && 0 <= bt_transl_index && !origs[bt_orig_index].previously_aligned && !transls[bt_transl_index].previously_aligned;
                 --bt_orig_index, --bt_transl_index)
            {
                cv::Mat resized;

#ifndef ALIGN_DEBUG
                cv::resize(transls[bt_transl_index].img, resized, cv::Size(origs[bt_orig_index].img.cols, origs[bt_orig_index].img.rows), 0, 0, cv::INTER_AREA);
#else
                cv::resize(transls[bt_transl_index].img_kp, resized, cv::Size(origs[bt_orig_index].img.cols, origs[bt_orig_index].img.rows), 0, 0, cv::INTER_AREA);
#endif
                cnt += 1;

                std::cout << "[AA] TRANSL-" << transls[bt_transl_index].index << " backtrack paired with ORIG-" << origs[bt_orig_index].index << std::endl;
                write_im_and_info(std::filesystem::path(dst_path) / (std::to_string(origs[bt_orig_index].index + 1000001)), resized);
            }

            bool orig_double_page = double_page(origs[i].img_grey);
            bool transl_double_page = double_page(transls[transl_index].img_grey);

            // pop all skipped/backtracked images
            if (i > 0)
            {
                origs.erase(origs.begin(), origs.begin() + i);
            }
            i = -1; // because for cycle will bump it to 0...
            if (transl_index > 0)
            {
                transls.erase(transls.begin(), transls.begin() + transl_index);
                transl_index = 0;
            }
            // if orig is single page or both are double no need to search for more matching translations // (although if both are double paged we might need to keep if there is a mismatch in even and odd pages...)
            if (!orig_double_page || (orig_double_page && transl_double_page))
            {
                // std::cout << "[DEBUG] ORIG-" << origs[0].index << " popped" << std::endl;
                origs.pop_front();
            }
            // if orig was a single page and translation a double and not aligned before, the other half may still be useful, so we need to continue
            if (transls[transl_index].previously_aligned == false && !orig_double_page && transl_double_page)
            {
                transls[transl_index].previously_aligned = true;
                continue;
            }

            // if translation was a single page, or double page but already used once, we are done and can return
            // std::cout << "[DEBUG] TRANSL-" << transls[0].index << " popped" << std::endl;
            transls.pop_front();
            return cnt;
        }
        catch (const std::runtime_error &error)
        {
#ifdef ALIGN_DEBUG
            std::cout << "[DEBUG] TRANSL-" << transls[transl_index].index << " couldn't be aligned to ORIG-" << origs[i].index << " // " << error.what() << std::endl;
            transls[transl_index].img_kp = debug_transl;
#endif
        }

#ifdef ALIGN_DEBUG
        write_im_and_info(std::filesystem::path(dst_path).parent_path().parent_path() / "out_orig" / (std::to_string(origs[i].index + 1000001)), debug_orig);
#endif
    }
    return 0;
}

int add_transl(std::string dst_path, int width, int height, int resize, bool do_split, bool do_crop, bool right2left, int orb_count)
{
    int loaded_cnt = load_raw(width, height, transls, transl_count, resize, do_split, do_crop, right2left);
    int total_cnt = 0;
    for (int i = loaded_cnt; i > 0; --i)
    {
        total_cnt += find_pairing(dst_path, transls.size() - i, orb_count);
    }
    return total_cnt;
}

void clean()
{
    origs.clear();
    transls.clear();
    orig_count = 0;
    transl_count = 0;
    formatter->setMultiline(false);
}

EMSCRIPTEN_BINDINGS(aligner_module)
{
    emscripten::function("clean", &clean);
    emscripten::function("add_orig", &add_orig);
    emscripten::function("add_transl", &add_transl);
}