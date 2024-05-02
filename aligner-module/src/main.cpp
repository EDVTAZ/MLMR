#include <numeric>
#include <filesystem>
#include <fstream>
#include "opencv2/opencv.hpp"

#include <emscripten/bind.h>

const double EPS = 0.1;
const int PIXEL_EPS = 10;
const double RATIO_LOWER = 2 / 3 - EPS;
const double RATIO_HIGHER = 2 / 3 + EPS;
const int SEARCH_RANGE = 10;

std::vector<cv::Mat> origs;
std::vector<cv::Mat> transls;
std::vector<cv::Mat> origs_grey;
std::vector<cv::Mat> transls_grey;
int transl_backtrack_count = 0;
int orig_index = 0;
cv::Mat last_aligned;
bool first_match = true;

bool double_page(cv::Mat img)
{
    double ratio = img.cols / img.rows;
    if (RATIO_HIGHER > ratio && ratio > RATIO_LOWER)
    {
        return false;
    }
    return true;
}

cv::Mat downscale(cv::Mat &img, int target_size)
{
    if (target_size > 0 && target_size < img.cols * img.rows)
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
        cv::cvtColor(img_color, img_grey, cv::COLOR_BGR2GRAY);
    }
}

bool same_color_col(cv::Mat &img, int colnum)
{
    uint8_t top = img.col(colnum).at<uint8_t>(0);
    return cv::checkRange(img.col(colnum), true, NULL, top, top + 1);
}

int load_and_preproc(std::string img_path, std::vector<cv::Mat> &color_acc, std::vector<cv::Mat> &grey_acc, int resize, bool do_split, bool do_crop, bool right2left)
{
    cv::Mat img_color = cv::imread(img_path);
    cv::Mat img_grey;
    cv::cvtColor(img_color, img_grey, cv::COLOR_BGR2GRAY);
    cv::cvtColor(img_color, img_color, cv::COLOR_BGR2BGRA);

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
            grey_acc.push_back(downscale(tmp2_grey, resize));
            grey_acc.push_back(downscale(tmp1_grey, resize));
            color_acc.push_back(downscale(tmp2_color, resize));
            color_acc.push_back(downscale(tmp1_color, resize));
        }
        else
        {
            grey_acc.push_back(downscale(tmp1_grey, resize));
            grey_acc.push_back(downscale(tmp2_grey, resize));
            color_acc.push_back(downscale(tmp1_color, resize));
            color_acc.push_back(downscale(tmp2_color, resize));
        }

        return 2;
    }
    else
    {
        grey_acc.push_back(downscale(img_grey, resize));
        color_acc.push_back(downscale(img_color, resize));
        return 1;
    }
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
        std::cout << "Error opening image info file for write: " << name << std::endl;
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

    cv::Mat homography = cv::findHomography(alig_matched, ref_matched, mask, cv::RANSAC);
    int inlier_count = std::accumulate(mask.begin(), mask.end(), 0);

    checkHomography(inlier_count, to_align_grey, refim_grey, homography);

    cv::Mat warped_color;
    cv::warpPerspective(to_align_color, warped_color, homography,
                        cv::Size(refim_color.cols, refim_color.rows), cv::INTER_LINEAR,
                        cv::BorderTypes::BORDER_CONSTANT, cv::Vec4b(0, 0, 0, 0));

    return warped_color;
}

int add_orig(std::string src_path, std::string dst_path, int resize, bool do_split, bool do_crop, bool right2left)
{
    int cnt = load_and_preproc(src_path, origs, origs_grey, resize, do_split, do_crop, right2left);

    write_im_and_info(std::filesystem::path(dst_path) / (std::to_string(origs.size() + 1000000)), origs.back());

    if (cnt > 1)
    {
        write_im_and_info(std::filesystem::path(dst_path) / (std::to_string(origs.size() - 1 + 1000000)), origs[origs.size() - 2]);
    }
    return cnt;
}

int find_pairing(std::string dst_path, int transl_index, int orb_count)
{
    int cnt = 0;
    bool no_more = false;
    for (int i = 0; i < SEARCH_RANGE && orig_index + i < origs.size(); ++i)
    {
        try
        {
            cv::Mat aligned = align(transls[transl_index], transls_grey[transl_index], origs[orig_index + i], origs_grey[orig_index + i], orb_count);
            cnt += 1;
            if (!first_match && i == 0)
            {
                cv::add(last_aligned, aligned, last_aligned);
            }
            else
            {
                last_aligned = aligned;
                first_match = false;
            }
            write_im_and_info(std::filesystem::path(dst_path) / (std::to_string(orig_index + i + 1000001)), last_aligned);
            for (int j = 0; j < transl_backtrack_count && j < i; ++j)
            {
                int bt_orig_index = orig_index + i - (j + 1);
                int bt_transl_index = transl_index - (j + 1);
                if (bt_orig_index <= orig_index && !first_match)
                    break;

                cv::Mat resized;
                cv::resize(transls[bt_transl_index], resized, cv::Size(origs[bt_orig_index].cols, origs[bt_orig_index].rows), 0, 0, cv::INTER_AREA);
                cnt += 1;
                write_im_and_info(std::filesystem::path(dst_path) / (std::to_string(bt_orig_index + 1000001)), resized);
            }
            // if this is single page or both are double no need to search for more matching translations
            bool orig_double_page = double_page(origs_grey[orig_index + i]);
            bool transl_double_page = double_page(transls_grey[transl_index]);
            if (!orig_double_page || (orig_double_page && transl_double_page))
            {
                orig_index += 1;
                first_match = true;
            }
            transl_backtrack_count = 0;

            if (!no_more && !orig_double_page && transl_double_page)
            {
                no_more = true;
                orig_index -= 1;
                continue;
            }

            orig_index += i;

            return cnt;
        }
        catch (const std::runtime_error &error)
        {
            // std::cout << "Failed alignment: " << error.what() << std::endl;
        }
    }
    if (!no_more)
    {
        transl_backtrack_count += 1;
    }
    return 0;
}

int add_transl(std::string src_path, std::string dst_path, int resize, bool do_split, bool do_crop, bool right2left, int orb_count)
{
    int loaded_cnt = load_and_preproc(src_path, transls, transls_grey, resize, do_split, do_crop, right2left);
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
    origs_grey.clear();
    transls_grey.clear();
    transl_backtrack_count = 0;
    orig_index = 0;
    first_match = true;
}

EMSCRIPTEN_BINDINGS(aligner_module)
{
    emscripten::function("clean", &clean);
    emscripten::function("add_orig", &add_orig);
    emscripten::function("add_transl", &add_transl);
}